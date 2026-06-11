---
name: DevTracker Design System
colors:
  surface: '#141313'
  surface-dim: '#141313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353434'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#c7c6c6'
  on-secondary: '#2f3131'
  secondary-container: '#484949'
  on-secondary-container: '#b8b8b8'
  tertiary: '#ffffff'
  on-tertiary: '#2f3131'
  tertiary-container: '#e2e2e2'
  on-tertiary-container: '#636565'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e3e2e2'
  secondary-fixed-dim: '#c7c6c6'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#141313'
  on-background: '#e5e2e1'
  surface-variant: '#353434'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 24px
  container-max: 1200px
---

## Brand & Style
Ce système de design est conçu pour la précision, la clarté et la concentration. Il adopte une esthétique **Minimaliste** et utilitaire, optimisée pour le flux de travail des développeurs. L'interface s'efface pour laisser place au contenu, en utilisant des noirs profonds, des gris structuraux et une typographie rigoureuse.

L'expérience utilisateur doit évoquer la rapidité et la fiabilité technique. L'influence est tirée des outils de productivité modernes à haute performance : bordures fines, espacement généreux et absence totale de fioritures visuelles. L'accent est mis sur la hiérarchie de l'information et la lisibilité du code.

## Colors
La palette est intentionnellement restreinte pour minimiser la fatigue cognitive. 

- **Fond (#0F0F0F) :** Un noir presque pur pour un contraste maximal avec le texte.
- **Surface (#1A1A1A) :** Utilisé pour les cartes, les panneaux latéraux et les éléments flottants pour créer une hiérarchie visuelle subtile.
- **Bordure (#2A2A2A) :** La structure principale de l'interface repose sur ces lignes fines plutôt que sur des ombres portées.
- **Accents :** Utilisés exclusivement pour le statut et la progression. Le blanc pur est réservé aux actions principales et aux titres de haut niveau.

## Typography
Le système utilise une approche bi-typographique :

1.  **Inter :** Utilisé pour toute l'interface utilisateur standard. Les graisses sont maintenues entre *Regular* (400) et *Semi-Bold* (600) pour préserver l'élégance.
2.  **JetBrains Mono :** Réservé aux métadonnées techniques, aux identifiants de tickets, aux dates et aux blocs de code. Cela renforce l'aspect "outil de développement".

Toutes les tailles de police sont optimisées pour la densité d'information, privilégiant une lisibilité nette sur des écrans haute résolution.

## Layout & Spacing
Le système repose sur une grille de **8px** (avec une sous-unité de 4px). 

- **Modèle de mise en page :** Utilisation d'une grille fluide pour le contenu principal, encadrée par des panneaux latéraux fixes (Sidebar).
- **Densité :** L'espacement doit être serré mais structuré. Les listes de tâches utilisent un padding vertical réduit pour maximiser la visibilité des données.
- **Responsive :** Sur mobile, les marges passent à 16px et les éléments interactifs (boutons) conservent une zone tactile minimale de 44px malgré l'esthétique minimaliste.

## Elevation & Depth
La profondeur est communiquée par des **couches tonales** plutôt que par des ombres portées traditionnelles.

- **Niveau 0 (Fond) :** #0F0F0F.
- **Niveau 1 (Cartes/Sidebar) :** #1A1A1A avec une bordure de 1px #2A2A2A.
- **Niveau 2 (Modales/Popovers) :** #1A1A1A avec une bordure légèrement plus claire (#3A3A3A) pour simuler la proximité.

Aucune ombre n'est utilisée, sauf pour les menus contextuels où une ombre noire très diffuse (0px 10px 30px rgba(0,0,0,0.5)) peut être appliquée pour séparer l'élément du contenu complexe en dessous.

## Shapes
Les formes suivent une approche **"Soft"** (douce). Les rayons de courbure sont subtils pour conserver un aspect professionnel et rigoureux.

- **Composants standards :** 4px (0.25rem).
- **Conteneurs et Cartes :** 8px (0.5rem).
- **Champs de saisie :** 6px (0.375rem).

Cette légère courbure adoucit le contraste élevé du thème sombre sans paraître trop ludique ou enfantin.

## Components

### Buttons
- **Primary :** Fond blanc (#FFFFFF), texte noir (#0F0F0F). Pas de bordure.
- **Secondary :** Fond transparent, bordure #2A2A2A, texte #FFFFFF.
- **Ghost :** Fond transparent, texte #A1A1A1. Au survol, fond #1A1A1A et texte #FFFFFF.

### Input Fields
Les champs sont discrets. Fond #0F0F0F, bordure #2A2A2A. Lors du focus, la bordure devient #FFFFFF ou une couleur d'accentuation spécifique au projet.

### Progress Bars
Utilisent un fond #2A2A2A (rail) et une couleur vive (Success/Dynamic) pour la partie remplie. Hauteur fine de 4px ou 6px.

### Status Pills
Utilisent la typographie `label-caps`. Fond coloré à très faible opacité (10-15%) avec texte de la même couleur en pleine opacité. Pas de bordure.

### Lists & Tables
Lignes séparées par des bordures horizontales fines de 1px (#2A2A2A). Pas de zébrures (alternance de couleurs de fond) ; privilégiez un changement d'état au survol (hover) vers #1A1A1A.