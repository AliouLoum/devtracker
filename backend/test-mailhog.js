const nodemailer = require('nodemailer');

async function test() {
  try {
    const transporter = nodemailer.createTransport({
      host: 'mailhog',
      port: 1025,
      ignoreTLS: true,
    });

    await transporter.sendMail({
      from: 'test@local.dev',
      to: 'test@local.dev',
      subject: 'Test connection to mailhog',
      text: 'It works!'
    });
    console.log('Email sent successfully via script');
  } catch (e) {
    console.error('Email failed via script', e);
  }
}

test();
