import os
import json
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException
import socketio
from openai import AsyncOpenAI
from jose import jwt
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env") # Load from root .env

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-service")

# Environment variables
JWT_SECRET = os.getenv("JWT_ACCESS_SECRET", "change-me-access-secret-min-32-chars")
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
NVIDIA_API_URL = os.getenv("NVIDIA_API_URL", "https://integrate.api.nvidia.com/v1")
NVIDIA_MODEL = os.getenv("NVIDIA_MODEL_DEFAULT", "meta/llama-3.1-70b-instruct")

DB_HOST = os.getenv("DATABASE_HOST", "devtracker-postgres")
DB_PORT = os.getenv("DATABASE_PORT", "5432")
DB_USER = os.getenv("DATABASE_USER", "devtracker")
DB_PASSWORD = os.getenv("DATABASE_PASSWORD", "devtracker_secret")
DB_NAME = os.getenv("DATABASE_NAME", "devtracker")

# Initialize OpenAI Client (NVIDIA NIM compatible)
client = AsyncOpenAI(
    base_url=NVIDIA_API_URL,
    api_key=NVIDIA_API_KEY
)

# Initialize Socket.IO and FastAPI
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = FastAPI()
socket_app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path='/socket.io')

# Helper: Get user's context from Postgres
def get_user_context(user_id: str) -> str:
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            dbname=DB_NAME
        )
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get projects
        cur.execute("SELECT name, status, description FROM projects WHERE user_id = %s", (user_id,))
        projects = cur.fetchall()
        
        # Get tasks
        cur.execute("SELECT title, priority, status FROM tasks WHERE user_id = %s", (user_id,))
        tasks = cur.fetchall()
        
        cur.close()
        conn.close()
        
        context = "Here is the user's current context in DevTracker:\n"
        context += "Projects:\n"
        for p in projects:
            context += f"- {p['name']} ({p['status']}): {p['description'] or 'No description'}\n"
        
        context += "\nTasks:\n"
        for t in tasks:
            context += f"- {t['title']} (Priority: {t['priority']}, Status: {t['status']})\n"
            
        return context
    except Exception as e:
        logger.error(f"Error fetching context: {e}")
        return "No specific context available due to an error."

@sio.on('connect', namespace='/ai')
async def connect(sid, environ, auth):
    token = auth.get('token') if auth else None
    if not token:
        logger.warning("No token provided")
        return False # Reject connection
        
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user_id = payload.get('sub')
        async with sio.session(sid, namespace='/ai') as session:
            session['user_id'] = user_id
        logger.info(f"Client connected: {sid} user_id: {user_id}")
    except Exception as e:
        logger.warning(f"Invalid token: {e}")
        return False

@sio.on('disconnect', namespace='/ai')
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")

@sio.on('chat', namespace='/ai')
async def handle_chat(sid, data):
    session = await sio.get_session(sid, namespace='/ai')
    user_id = session.get('user_id')
    if not user_id:
        return
        
    message = data.get('message', '')
    history = data.get('history', [])
    
    logger.info(f"Received chat from {user_id}: {message}")
    
    # Build System Prompt with real DB context
    system_prompt = (
        "Tu es l'assistant IA de DevTracker. Tu dois aider l'utilisateur avec la gestion de ses projets et tâches.\n"
        "Réponds en français par défaut. Sois concis et professionnel.\n\n"
    )
    system_prompt += get_user_context(user_id)
    
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
    
    messages.append({"role": "user", "content": message})
    
    try:
        response = await client.chat.completions.create(
            model=NVIDIA_MODEL,
            messages=messages,
            stream=True,
            temperature=0.7,
            max_tokens=1024
        )
        
        full_text = ""
        async for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                full_text += content
                await sio.emit('chat-token', {'token': content}, to=sid, namespace='/ai')
                
        await sio.emit('chat-done', {'fullText': full_text}, to=sid, namespace='/ai')
        
    except Exception as e:
        logger.error(f"Error calling NVIDIA API: {e}")
        await sio.emit('chat-error', {'error': str(e)}, to=sid, namespace='/ai')

# Mount the socket_app on FastAPI
app.mount("/", socket_app)
