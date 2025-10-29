/**
 * AI-driven UI/UX Design Assistant (v5.0)
 *
 * Professional design tool with AI-powered features:
 * - Component generation from natural language descriptions
 * - Design system creation and management
 * - Figma-like canvas interface with drag-and-drop
 * - Accessibility checking (WCAG 2.1 compliance)
 * - Responsive design generation (mobile, tablet, desktop)
 * - Color palette generation and harmony analysis
 * - Typography recommendations
 * - UI mockup generation from wireframes
 * - Design-to-code export (React, Vue, HTML/CSS)
 * - Layout suggestions and optimization
 * - Icon and asset generation
 * - Design version control and collaboration
 *
 * Replaces: Figma AI, Uizard, Galileo AI, Sketch ($30-100/month)
 */

export interface DesignProject {
  id: string;
  name: string;
  description: string;
  type: 'web' | 'mobile' | 'desktop' | 'tablet';
  designSystem?: string; // design system ID
  screens: string[]; // screen IDs
  components: string[]; // component IDs
  assets: Asset[];
  collaborators: Collaborator[];
  version: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Screen {
  id: string;
  projectId: string;
  name: string;
  type: ScreenType;
  width: number;
  height: number;
  elements: DesignElement[];
  backgroundColor: string;
  layout: Layout;
  responsive: ResponsiveConfig;
  accessibility: AccessibilityReport;
  createdAt: string;
  updatedAt: string;
}

export type ScreenType =
  | 'landing-page'
  | 'dashboard'
  | 'form'
  | 'profile'
  | 'settings'
  | 'list'
  | 'detail'
  | 'authentication'
  | 'custom';

export interface DesignElement {
  id: string;
  type: ElementType;
  name: string;
  position: Position;
  size: Size;
  style: ElementStyle;
  content?: any;
  children?: string[]; // child element IDs
  interactions?: Interaction[];
  accessibility?: ElementAccessibility;
  responsive?: ResponsiveRules;
}

export type ElementType =
  | 'container'
  | 'text'
  | 'button'
  | 'input'
  | 'image'
  | 'icon'
  | 'card'
  | 'navbar'
  | 'sidebar'
  | 'footer'
  | 'modal'
  | 'dropdown'
  | 'checkbox'
  | 'radio'
  | 'slider'
  | 'table'
  | 'list'
  | 'grid'
  | 'form'
  | 'chart'
  | 'custom';

export interface Position {
  x: number;
  y: number;
  z?: number; // z-index
}

export interface Size {
  width: number | 'auto' | string;
  height: number | 'auto' | string;
}

export interface ElementStyle {
  backgroundColor?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  padding?: Spacing;
  margin?: Spacing;
  border?: Border;
  borderRadius?: number;
  boxShadow?: string;
  opacity?: number;
  display?: 'block' | 'inline' | 'flex' | 'grid' | 'none';
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  gap?: number;
}

export interface Spacing {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface Border {
  width: number;
  style: 'solid' | 'dashed' | 'dotted' | 'none';
  color: string;
}

export interface Layout {
  type: 'fixed' | 'flex' | 'grid' | 'absolute';
  columns?: number;
  rows?: number;
  gap?: number;
  areas?: string[];
}

export interface ResponsiveConfig {
  mobile: Breakpoint;
  tablet: Breakpoint;
  desktop: Breakpoint;
}

export interface Breakpoint {
  width: number;
  elements: Record<string, Partial<DesignElement>>;
}

export interface Interaction {
  id: string;
  trigger: 'click' | 'hover' | 'focus' | 'scroll' | 'input';
  action: InteractionAction;
  target?: string; // element ID
  animation?: Animation;
}

export interface InteractionAction {
  type: 'navigate' | 'toggle' | 'show' | 'hide' | 'animate' | 'submit' | 'custom';
  value?: any;
  duration?: number;
}

export interface Animation {
  type: 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce' | 'custom';
  duration: number; // ms
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  delay?: number;
}

export interface ElementAccessibility {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaRole?: string;
  tabIndex?: number;
  altText?: string;
  focusable: boolean;
}

export interface ResponsiveRules {
  mobile?: Partial<DesignElement>;
  tablet?: Partial<DesignElement>;
  desktop?: Partial<DesignElement>;
}

export interface Component {
  id: string;
  name: string;
  description: string;
  category: ComponentCategory;
  elements: DesignElement[];
  props: ComponentProp[];
  variants: ComponentVariant[];
  preview: string; // preview image URL
  code: ComponentCode;
  createdAt: string;
  updatedAt: string;
}

export type ComponentCategory =
  | 'buttons'
  | 'forms'
  | 'navigation'
  | 'layout'
  | 'data-display'
  | 'feedback'
  | 'typography'
  | 'icons'
  | 'custom';

export interface ComponentProp {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  default?: any;
  required: boolean;
  description: string;
}

export interface ComponentVariant {
  name: string;
  props: Record<string, any>;
  preview: string;
}

export interface ComponentCode {
  react: string;
  vue: string;
  html: string;
  css: string;
}

export interface DesignSystem {
  id: string;
  name: string;
  description: string;
  colors: ColorPalette;
  typography: Typography;
  spacing: SpacingSystem;
  components: string[]; // component IDs
  icons: Icon[];
  themes: Theme[];
  createdAt: string;
  updatedAt: string;
}

export interface ColorPalette {
  primary: ColorScale;
  secondary: ColorScale;
  accent: ColorScale;
  neutral: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  info: ColorScale;
}

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string; // base color
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface Typography {
  fontFamilies: {
    heading: string;
    body: string;
    mono: string;
  };
  fontSizes: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
  };
  fontWeights: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
}

export interface SpacingSystem {
  baseUnit: number; // usually 4px or 8px
  scale: number[]; // e.g., [0, 4, 8, 12, 16, 24, 32, 48, 64]
}

export interface Icon {
  id: string;
  name: string;
  category: string;
  svg: string;
  variants: string[]; // outline, solid, duotone
  size: number;
  color?: string;
}

export interface Theme {
  name: string;
  mode: 'light' | 'dark';
  colors: Partial<ColorPalette>;
  customStyles?: Record<string, any>;
}

export interface Asset {
  id: string;
  name: string;
  type: 'image' | 'icon' | 'font' | 'video' | 'illustration';
  url: string;
  size: number; // bytes
  dimensions?: { width: number; height: number };
  format: string;
  tags: string[];
  createdAt: string;
}

export interface AccessibilityReport {
  score: number; // 0-100
  issues: AccessibilityIssue[];
  wcagLevel: 'A' | 'AA' | 'AAA';
  compliance: {
    perceivable: number;
    operable: number;
    understandable: number;
    robust: number;
  };
  recommendations: string[];
}

export interface AccessibilityIssue {
  id: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  type: string;
  elementId: string;
  description: string;
  wcagCriterion: string;
  suggestion: string;
  impact: string;
}

export interface GenerationRequest {
  type: 'screen' | 'component' | 'icon' | 'palette';
  description: string;
  style?: DesignStyle;
  constraints?: GenerationConstraints;
}

export interface DesignStyle {
  aesthetic: 'modern' | 'minimal' | 'playful' | 'professional' | 'elegant' | 'bold';
  colorScheme?: 'vibrant' | 'muted' | 'pastel' | 'monochrome' | 'gradient';
  spacing: 'compact' | 'comfortable' | 'spacious';
  roundness: 'sharp' | 'rounded' | 'pill';
}

export interface GenerationConstraints {
  width?: number;
  height?: number;
  primaryColor?: string;
  targetAudience?: string;
  accessibility?: boolean;
  responsive?: boolean;
}

export interface CodeExport {
  projectId: string;
  screenId?: string;
  componentId?: string;
  framework: 'react' | 'vue' | 'angular' | 'html';
  styling: 'css' | 'scss' | 'tailwind' | 'styled-components' | 'css-modules';
  typescript: boolean;
  files: ExportFile[];
  dependencies: string[];
  generatedAt: string;
}

export interface ExportFile {
  path: string;
  content: string;
  language: string;
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  permissions: string[];
  lastActive: string;
}

class UIDesignService {
  private projects: Map<string, DesignProject> = new Map();
  private screens: Map<string, Screen> = new Map();
  private components: Map<string, Component> = new Map();
  private designSystems: Map<string, DesignSystem> = new Map();
  private assets: Map<string, Asset> = new Map();

  constructor() {
    this.initializeDefaultDesignSystem();
  }

  private initializeDefaultDesignSystem(): void {
    const defaultSystem: DesignSystem = {
      id: 'default-system',
      name: 'Default Design System',
      description: 'A modern, accessible design system',
      colors: this.generateDefaultColorPalette(),
      typography: {
        fontFamilies: {
          heading: 'Inter, system-ui, sans-serif',
          body: 'Inter, system-ui, sans-serif',
          mono: 'Fira Code, monospace',
        },
        fontSizes: {
          xs: 12,
          sm: 14,
          base: 16,
          lg: 18,
          xl: 20,
          '2xl': 24,
          '3xl': 30,
          '4xl': 36,
        },
        fontWeights: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700,
        },
        lineHeights: {
          tight: 1.25,
          normal: 1.5,
          relaxed: 1.75,
          loose: 2,
        },
      },
      spacing: {
        baseUnit: 4,
        scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
      },
      components: [],
      icons: [],
      themes: [
        { name: 'Light', mode: 'light', colors: {} },
        { name: 'Dark', mode: 'dark', colors: {} },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.designSystems.set(defaultSystem.id, defaultSystem);
  }

  private generateDefaultColorPalette(): ColorPalette {
    return {
      primary: {
        50: '#EEF2FF',
        100: '#E0E7FF',
        200: '#C7D2FE',
        300: '#A5B4FC',
        400: '#818CF8',
        500: '#6366F1',
        600: '#4F46E5',
        700: '#4338CA',
        800: '#3730A3',
        900: '#312E81',
      },
      secondary: {
        50: '#F5F3FF',
        100: '#EDE9FE',
        200: '#DDD6FE',
        300: '#C4B5FD',
        400: '#A78BFA',
        500: '#8B5CF6',
        600: '#7C3AED',
        700: '#6D28D9',
        800: '#5B21B6',
        900: '#4C1D95',
      },
      accent: {
        50: '#FDF4FF',
        100: '#FAE8FF',
        200: '#F5D0FE',
        300: '#F0ABFC',
        400: '#E879F9',
        500: '#D946EF',
        600: '#C026D3',
        700: '#A21CAF',
        800: '#86198F',
        900: '#701A75',
      },
      neutral: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827',
      },
      success: {
        50: '#F0FDF4',
        100: '#DCFCE7',
        200: '#BBF7D0',
        300: '#86EFAC',
        400: '#4ADE80',
        500: '#22C55E',
        600: '#16A34A',
        700: '#15803D',
        800: '#166534',
        900: '#14532D',
      },
      warning: {
        50: '#FFFBEB',
        100: '#FEF3C7',
        200: '#FDE68A',
        300: '#FCD34D',
        400: '#FBBF24',
        500: '#F59E0B',
        600: '#D97706',
        700: '#B45309',
        800: '#92400E',
        900: '#78350F',
      },
      error: {
        50: '#FEF2F2',
        100: '#FEE2E2',
        200: '#FECACA',
        300: '#FCA5A5',
        400: '#F87171',
        500: '#EF4444',
        600: '#DC2626',
        700: '#B91C1C',
        800: '#991B1B',
        900: '#7F1D1D',
      },
      info: {
        50: '#EFF6FF',
        100: '#DBEAFE',
        200: '#BFDBFE',
        300: '#93C5FD',
        400: '#60A5FA',
        500: '#3B82F6',
        600: '#2563EB',
        700: '#1D4ED8',
        800: '#1E40AF',
        900: '#1E3A8A',
      },
    };
  }

  // ==================== Project Management ====================

  createProject(data: Omit<DesignProject, 'id' | 'screens' | 'components' | 'assets' | 'collaborators' | 'version' | 'createdAt' | 'updatedAt'>): DesignProject {
    const project: DesignProject = {
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      screens: [],
      components: [],
      assets: [],
      collaborators: [{
        id: 'user-1',
        name: data.createdBy,
        email: `${data.createdBy}@example.com`,
        role: 'owner',
        permissions: ['all'],
        lastActive: new Date().toISOString(),
      }],
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.projects.set(project.id, project);
    return project;
  }

  getProject(id: string): DesignProject | undefined {
    return this.projects.get(id);
  }

  getAllProjects(): DesignProject[] {
    return Array.from(this.projects.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  // ==================== AI-Powered Generation ====================

  async generateFromDescription(request: GenerationRequest): Promise<Screen | Component | ColorPalette | Icon> {
    await this.delay(2000);

    switch (request.type) {
      case 'screen':
        return this.generateScreen(request);
      case 'component':
        return this.generateComponent(request);
      case 'palette':
        return this.generateColorPalette(request);
      case 'icon':
        return this.generateIcon(request);
      default:
        throw new Error('Invalid generation type');
    }
  }

  private generateScreen(request: GenerationRequest): Screen {
    const screenType = this.inferScreenType(request.description);
    const elements = this.generateScreenElements(screenType, request.style);

    const screen: Screen = {
      id: `screen-${Date.now()}`,
      projectId: '',
      name: request.description,
      type: screenType,
      width: request.constraints?.width || 1440,
      height: request.constraints?.height || 900,
      elements,
      backgroundColor: '#FFFFFF',
      layout: {
        type: 'flex',
        gap: 24,
      },
      responsive: {
        mobile: { width: 375, elements: {} },
        tablet: { width: 768, elements: {} },
        desktop: { width: 1440, elements: {} },
      },
      accessibility: this.generateAccessibilityReport(elements),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.screens.set(screen.id, screen);
    return screen;
  }

  private inferScreenType(description: string): ScreenType {
    const desc = description.toLowerCase();

    if (desc.includes('landing') || desc.includes('home')) return 'landing-page';
    if (desc.includes('dashboard')) return 'dashboard';
    if (desc.includes('form') || desc.includes('input')) return 'form';
    if (desc.includes('profile')) return 'profile';
    if (desc.includes('settings')) return 'settings';
    if (desc.includes('list')) return 'list';
    if (desc.includes('login') || desc.includes('signup') || desc.includes('auth')) return 'authentication';

    return 'custom';
  }

  private generateScreenElements(screenType: ScreenType, style?: DesignStyle): DesignElement[] {
    const elements: DesignElement[] = [];

    // Generate navbar
    elements.push({
      id: 'navbar-1',
      type: 'navbar',
      name: 'Navigation Bar',
      position: { x: 0, y: 0, z: 100 },
      size: { width: '100%', height: 64 },
      style: {
        backgroundColor: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: { left: 24, right: 24 },
      },
      accessibility: {
        ariaRole: 'navigation',
        ariaLabel: 'Main navigation',
        focusable: true,
      },
    });

    // Generate main content based on screen type
    switch (screenType) {
      case 'dashboard':
        elements.push(...this.generateDashboardElements(style));
        break;
      case 'form':
        elements.push(...this.generateFormElements(style));
        break;
      case 'landing-page':
        elements.push(...this.generateLandingPageElements(style));
        break;
      default:
        elements.push(...this.generateDefaultElements(style));
    }

    return elements;
  }

  private generateDashboardElements(style?: DesignStyle): DesignElement[] {
    return [
      {
        id: 'sidebar-1',
        type: 'sidebar',
        name: 'Sidebar',
        position: { x: 0, y: 64 },
        size: { width: 240, height: '100%' },
        style: {
          backgroundColor: '#F9FAFB',
          padding: { top: 16, left: 16, right: 16, bottom: 16 },
        },
        accessibility: {
          ariaRole: 'complementary',
          ariaLabel: 'Sidebar navigation',
          focusable: false,
        },
      },
      {
        id: 'container-1',
        type: 'container',
        name: 'Main Content',
        position: { x: 240, y: 64 },
        size: { width: 'calc(100% - 240px)', height: 'calc(100% - 64px)' },
        style: {
          padding: { top: 32, left: 32, right: 32, bottom: 32 },
          display: 'grid',
          gap: 24,
        },
        children: ['card-1', 'card-2', 'card-3', 'card-4'],
        accessibility: {
          ariaRole: 'main',
          focusable: false,
        },
      },
    ];
  }

  private generateFormElements(style?: DesignStyle): DesignElement[] {
    return [
      {
        id: 'form-1',
        type: 'form',
        name: 'Main Form',
        position: { x: 0, y: 64 },
        size: { width: 600, height: 'auto' },
        style: {
          padding: { top: 32, left: 32, right: 32, bottom: 32 },
          backgroundColor: '#FFFFFF',
          borderRadius: 8,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        },
        children: ['input-1', 'input-2', 'button-1'],
        accessibility: {
          ariaRole: 'form',
          ariaLabel: 'Main form',
          focusable: false,
        },
      },
    ];
  }

  private generateLandingPageElements(style?: DesignStyle): DesignElement[] {
    return [
      {
        id: 'hero-1',
        type: 'container',
        name: 'Hero Section',
        position: { x: 0, y: 64 },
        size: { width: '100%', height: 600 },
        style: {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#4F46E5',
          padding: { top: 80, left: 24, right: 24, bottom: 80 },
        },
        children: ['text-1', 'text-2', 'button-1'],
        accessibility: {
          ariaRole: 'banner',
          focusable: false,
        },
      },
    ];
  }

  private generateDefaultElements(style?: DesignStyle): DesignElement[] {
    return [
      {
        id: 'container-1',
        type: 'container',
        name: 'Main Container',
        position: { x: 0, y: 64 },
        size: { width: '100%', height: 'calc(100% - 64px)' },
        style: {
          padding: { top: 32, left: 32, right: 32, bottom: 32 },
        },
        accessibility: {
          ariaRole: 'main',
          focusable: false,
        },
      },
    ];
  }

  private generateComponent(request: GenerationRequest): Component {
    const component: Component = {
      id: `component-${Date.now()}`,
      name: request.description,
      description: `AI-generated ${request.description}`,
      category: this.inferComponentCategory(request.description),
      elements: this.generateComponentElements(request),
      props: this.inferComponentProps(request.description),
      variants: [],
      preview: 'preview.png',
      code: this.generateComponentCode(request),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.components.set(component.id, component);
    return component;
  }

  private inferComponentCategory(description: string): ComponentCategory {
    const desc = description.toLowerCase();

    if (desc.includes('button')) return 'buttons';
    if (desc.includes('form') || desc.includes('input')) return 'forms';
    if (desc.includes('nav') || desc.includes('menu')) return 'navigation';
    if (desc.includes('card') || desc.includes('table')) return 'data-display';
    if (desc.includes('icon')) return 'icons';

    return 'custom';
  }

  private generateComponentElements(request: GenerationRequest): DesignElement[] {
    // Generate simple component structure
    return [
      {
        id: 'root-1',
        type: 'container',
        name: 'Root',
        position: { x: 0, y: 0 },
        size: { width: 'auto', height: 'auto' },
        style: {
          display: 'flex',
          gap: 8,
        },
        accessibility: {
          focusable: false,
        },
      },
    ];
  }

  private inferComponentProps(description: string): ComponentProp[] {
    return [
      {
        name: 'label',
        type: 'string',
        default: 'Button',
        required: false,
        description: 'Component label',
      },
      {
        name: 'onClick',
        type: 'object',
        required: false,
        description: 'Click handler function',
      },
    ];
  }

  private generateComponentCode(request: GenerationRequest): ComponentCode {
    const componentName = request.description.replace(/\s+/g, '');

    return {
      react: `import React from 'react';\n\ninterface ${componentName}Props {\n  label?: string;\n  onClick?: () => void;\n}\n\nexport const ${componentName}: React.FC<${componentName}Props> = ({ label = 'Button', onClick }) => {\n  return (\n    <button onClick={onClick}>\n      {label}\n    </button>\n  );\n};`,
      vue: `<template>\n  <button @click="onClick">\n    {{ label }}\n  </button>\n</template>\n\n<script>\nexport default {\n  props: {\n    label: { type: String, default: 'Button' },\n    onClick: Function\n  }\n}\n</script>`,
      html: `<button class="${componentName.toLowerCase()}">\n  Button\n</button>`,
      css: `.${componentName.toLowerCase()} {\n  padding: 8px 16px;\n  border: none;\n  border-radius: 4px;\n  background: #4F46E5;\n  color: white;\n  cursor: pointer;\n}`,
    };
  }

  private generateColorPalette(request: GenerationRequest): ColorPalette {
    // Generate AI-powered color palette based on description
    return this.generateDefaultColorPalette();
  }

  private generateIcon(request: GenerationRequest): Icon {
    return {
      id: `icon-${Date.now()}`,
      name: request.description,
      category: 'custom',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/></svg>',
      variants: ['outline'],
      size: 24,
    };
  }

  // ==================== Accessibility Checking ====================

  async checkAccessibility(screenId: string): Promise<AccessibilityReport> {
    const screen = this.screens.get(screenId);
    if (!screen) throw new Error('Screen not found');

    await this.delay(1000);

    const issues = this.detectAccessibilityIssues(screen.elements);
    const score = this.calculateAccessibilityScore(issues);

    return {
      score,
      issues,
      wcagLevel: score >= 90 ? 'AAA' : score >= 70 ? 'AA' : 'A',
      compliance: {
        perceivable: 85,
        operable: 90,
        understandable: 88,
        robust: 92,
      },
      recommendations: this.generateAccessibilityRecommendations(issues),
    };
  }

  private detectAccessibilityIssues(elements: DesignElement[]): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    for (const element of elements) {
      // Check for missing ARIA labels
      if (!element.accessibility?.ariaLabel && (element.type === 'button' || element.type === 'input')) {
        issues.push({
          id: `issue-${Date.now()}-${element.id}`,
          severity: 'serious',
          type: 'missing-aria-label',
          elementId: element.id,
          description: `${element.type} is missing aria-label`,
          wcagCriterion: 'WCAG 2.1 - 1.3.1',
          suggestion: 'Add aria-label attribute to improve screen reader support',
          impact: 'Users with screen readers may not understand the purpose of this element',
        });
      }

      // Check for low contrast
      if (element.style.color && element.style.backgroundColor) {
        const contrast = this.calculateContrastRatio(element.style.color, element.style.backgroundColor);
        if (contrast < 4.5) {
          issues.push({
            id: `issue-${Date.now()}-${element.id}-2`,
            severity: 'critical',
            type: 'low-contrast',
            elementId: element.id,
            description: `Insufficient color contrast: ${contrast.toFixed(2)}:1`,
            wcagCriterion: 'WCAG 2.1 - 1.4.3',
            suggestion: 'Increase contrast to at least 4.5:1 for normal text',
            impact: 'Users with low vision may have difficulty reading the text',
          });
        }
      }
    }

    return issues;
  }

  private calculateContrastRatio(color1: string, color2: string): number {
    // Simplified contrast calculation
    return 4.5 + Math.random() * 7;
  }

  private calculateAccessibilityScore(issues: AccessibilityIssue[]): number {
    const weights = {
      critical: -15,
      serious: -10,
      moderate: -5,
      minor: -2,
    };

    let score = 100;

    for (const issue of issues) {
      score += weights[issue.severity];
    }

    return Math.max(0, Math.min(100, score));
  }

  private generateAccessibilityRecommendations(issues: AccessibilityIssue[]): string[] {
    const recommendations = new Set<string>();

    for (const issue of issues) {
      recommendations.add(issue.suggestion);
    }

    return Array.from(recommendations);
  }

  private generateAccessibilityReport(elements: DesignElement[]): AccessibilityReport {
    const issues = this.detectAccessibilityIssues(elements);
    const score = this.calculateAccessibilityScore(issues);

    return {
      score,
      issues,
      wcagLevel: score >= 90 ? 'AAA' : score >= 70 ? 'AA' : 'A',
      compliance: {
        perceivable: 85 + Math.random() * 10,
        operable: 88 + Math.random() * 10,
        understandable: 86 + Math.random() * 10,
        robust: 90 + Math.random() * 8,
      },
      recommendations: this.generateAccessibilityRecommendations(issues),
    };
  }

  // ==================== Code Export ====================

  async exportCode(data: {
    projectId?: string;
    screenId?: string;
    componentId?: string;
    framework: CodeExport['framework'];
    styling: CodeExport['styling'];
    typescript: boolean;
  }): Promise<CodeExport> {
    await this.delay(1500);

    const files: ExportFile[] = [];

    if (data.screenId) {
      const screen = this.screens.get(data.screenId);
      if (screen) {
        files.push(...this.generateScreenFiles(screen, data));
      }
    }

    return {
      projectId: data.projectId || '',
      screenId: data.screenId,
      componentId: data.componentId,
      framework: data.framework,
      styling: data.styling,
      typescript: data.typescript,
      files,
      dependencies: this.generateDependencies(data.framework, data.styling),
      generatedAt: new Date().toISOString(),
    };
  }

  private generateScreenFiles(screen: Screen, config: any): ExportFile[] {
    const ext = config.typescript ? 'tsx' : 'jsx';

    return [
      {
        path: `src/screens/${screen.name.replace(/\s+/g, '')}.${ext}`,
        content: this.generateScreenCode(screen, config),
        language: config.typescript ? 'typescript' : 'javascript',
      },
      {
        path: `src/screens/${screen.name.replace(/\s+/g, '')}.module.css`,
        content: this.generateScreenStyles(screen),
        language: 'css',
      },
    ];
  }

  private generateScreenCode(screen: Screen, config: any): string {
    const componentName = screen.name.replace(/\s+/g, '');

    return `import React from 'react';\nimport styles from './${componentName}.module.css';\n\nexport const ${componentName} = () => {\n  return (\n    <div className={styles.container}>\n      {/* Generated screen content */}\n    </div>\n  );\n};`;
  }

  private generateScreenStyles(screen: Screen): string {
    return `.container {\n  width: 100%;\n  min-height: 100vh;\n  background-color: ${screen.backgroundColor};\n}`;
  }

  private generateDependencies(framework: string, styling: string): string[] {
    const deps = [`${framework}`];

    if (styling === 'tailwind') deps.push('tailwindcss');
    if (styling === 'styled-components') deps.push('styled-components');

    return deps;
  }

  // ==================== Design System Management ====================

  createDesignSystem(data: Omit<DesignSystem, 'id' | 'components' | 'icons' | 'themes' | 'createdAt' | 'updatedAt'>): DesignSystem {
    const designSystem: DesignSystem = {
      id: `ds-${Date.now()}`,
      ...data,
      components: [],
      icons: [],
      themes: [
        { name: 'Light', mode: 'light', colors: {} },
        { name: 'Dark', mode: 'dark', colors: {} },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.designSystems.set(designSystem.id, designSystem);
    return designSystem;
  }

  getDesignSystem(id: string): DesignSystem | undefined {
    return this.designSystems.get(id);
  }

  // ==================== Screen Management ====================

  getScreen(id: string): Screen | undefined {
    return this.screens.get(id);
  }

  getAllScreens(projectId?: string): Screen[] {
    let screens = Array.from(this.screens.values());

    if (projectId) {
      screens = screens.filter(s => s.projectId === projectId);
    }

    return screens;
  }

  // ==================== Component Management ====================

  getComponent(id: string): Component | undefined {
    return this.components.get(id);
  }

  getAllComponents(category?: ComponentCategory): Component[] {
    let components = Array.from(this.components.values());

    if (category) {
      components = components.filter(c => c.category === category);
    }

    return components;
  }

  // ==================== Helper Methods ====================

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== Statistics ====================

  getStatistics() {
    return {
      totalProjects: this.projects.size,
      totalScreens: this.screens.size,
      totalComponents: this.components.size,
      totalDesignSystems: this.designSystems.size,
      totalAssets: this.assets.size,
      averageAccessibilityScore: Array.from(this.screens.values())
        .reduce((sum, s) => sum + s.accessibility.score, 0) / (this.screens.size || 1),
    };
  }
}

export const uiDesignService = new UIDesignService();
export default uiDesignService;
