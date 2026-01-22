# SIPOA - Sistema Integral de Programación de Obras y Acciones

## Project Overview

SIPOA is a **Next.js 14 administrative system** for institutional project management built with **PrimeReact UI components**. The system manages project lifecycles through 5-stage workflows, catalogs management, and comprehensive permission-based access control.

## Architecture & Key Patterns

### Route Structure & Layouts
- **App Router**: Uses Next.js 13+ app directory structure
- **Nested Layouts**: `app/(main)/layout.tsx` wraps all admin pages with sidebar navigation
- **Route Groups**: `(main)` for authenticated pages, `(full-page)` for auth/landing pages
- **Page Organization**: Major modules are `proyectos/`, `catalogos/`, main dashboard at `page.tsx`

### State Management & Context
The app uses React Context extensively:
```typescript
// Context Provider Pattern - see app/layout.tsx
<AuthProvider>
  <NotificationProvider>
    <LayoutProvider>{children}</LayoutProvider>
  </NotificationProvider>
</AuthProvider>
```

**Key Contexts:**
- `AuthProvider` (`layout/context/authContext.tsx`) - User authentication & permissions
- `LayoutProvider` (`layout/context/layoutcontext.tsx`) - UI state (sidebar, themes)
- `MenuContext` - Active menu state management

### Mock System Architecture
**Centralized mocking** in `src/mocks/index.ts`:
```typescript
// Enable via environment variable
MOCK_CONFIG.enabled = process.env.NEXT_PUBLIC_USE_MOCKS === 'true'

// All services check mock status
if (MOCK_CONFIG.enabled) {
  return mockUtils.mockResponse(MOCK_DATA);
}
// Real API call
return await http.get('/api/endpoint');
```

**Pattern**: Every service (`src/services/`) supports both mock and real API modes

### Permission System
**Granular permissions** with dot notation:
- `catalogos.unidades.create` - Create units catalog
- `proyectos.read` - Read projects
- `catalogos.*.update` - Update any catalog

**Usage Pattern:**
```typescript
const { hasPermission } = useAuthGuard(['proyectos.read']);
if (!hasPermission('proyectos.create')) {
  // Show error or hide UI
}
```

### Component Architecture

#### Reusable Catalog Management
**`CatalogoManager`** component (`src/components/CatalogoManager.tsx`) provides:
- CRUD operations for any catalog type
- Dynamic column configuration from `CATALOGOS_CONFIG`
- Integrated permissions checking
- Consistent DataTable patterns

**Configuration-driven catalogs** in `src/config/catalogos.ts`:
```typescript
{
  key: 'unidades',
  title: 'Unidades Responsables', 
  permissions: ['catalogos.unidades'],
  columns: [/* DataTable column definitions */]
}
```

#### Project Wizard System
**Multi-stage project creation** with `ProyectoWizard` and `ProyectoStageSidebar`:
- **5 Stages**: Information General, Diagnóstico, Programa Operativo, Beneficiarios, Formulación
- **Stage Locking**: Sequential completion required
- **Progress Tracking**: Visual progress indicators per stage
- **Sidebar Editing**: Separate reusable component for stage forms

### TypeScript Structure
**Comprehensive type definitions** in `/types/`:
- `proyectos.d.ts` - Project entities and form data
- `catalogos.d.ts` - Catalog item interfaces  
- `layout.d.ts` - UI layout and menu types
- `demo.d.ts` - Legacy PrimeReact demo types (keep for compatibility)

**Key interfaces:**
```typescript
interface Proyecto {
  codigo: string;
  nombre: string;
  estado: 'borrador' | 'en_progreso' | 'completado' | /* etc */;
  progreso?: {
    diagnostico: number;
    programaOperativo: number;
    beneficiarios: number;
    formulacion: number;
  };
}
```

## Development Workflows

### Environment Setup
**WSL Development**: Project configured for `iepc` user in WSL Ubuntu
- VS Code workspace: `sipoa.code-workspace` 
- Setup script: `./setup-vscode.sh`
- **Always run as user `iepc`**, not root

### Key Commands
```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint checking
npm run format       # Prettier formatting
```

### Service Pattern
**Standard service structure** in `src/services/`:
```typescript
export const SomeService = {
  async getAll() {
    if (MOCK_CONFIG.enabled) {
      return mockUtils.mockResponse(MOCK_DATA);
    }
    return await http.get('/api/endpoint');
  }
}
```

### Mock Development
**Enable mocks** with `NEXT_PUBLIC_USE_MOCKS=true` in environment
- All data comes from `src/mocks/index.ts`
- Configurable delays: `MOCK_CONFIG.delays`
- Comprehensive user permission sets for testing

## Project-Specific Conventions

### Import Patterns
```typescript
// Internal components/services
import { useAuth } from '@/layout/context/authContext';
import ProyectoWizard from '@/src/components/ProyectoWizard';

// PrimeReact components (always individual imports)
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
```

### Menu & Navigation
**Dynamic menu activation** in `AppMenuitem.tsx`:
- Supports nested menu structures with `key-subkey` format
- Special handling for catalog routes: all `/catalogos/*` activate "Catalogos" menu
- Menu state managed through `MenuContext`

### Error Handling
**Toast notifications** via `NotificationContext`:
```typescript
const { show } = useNotification();
show({ severity: 'error', summary: 'Error', detail: 'Message' });
```

### Component Export Strategy
**Dual exports** for compatibility:
```typescript
export { ComponentName };  // Named export
export default ComponentName;  // Default export
```

## Integration Points

### PrimeReact Integration
- **Theme System**: Dynamic theme switching in `AppConfig.tsx`
- **Layout Management**: Responsive sidebar with overlay/static modes
- **Form Components**: Consistent validation and error display patterns

### Chart.js Integration
**Dashboard charts** (`app/(main)/page.tsx`):
- Bar charts for project metrics by unit
- Doughnut charts for project status distribution
- Theme-aware chart options that adapt to light/dark mode

### Authentication Flow
1. Login through mock system (`MOCK_USERS`)
2. Permission validation on route access (`useAuthGuard`)
3. Context-based permission checking throughout UI

## Critical Files to Understand

- `src/mocks/index.ts` - Central mock configuration and data
- `src/config/catalogos.ts` - Catalog definitions and column schemas  
- `layout/context/authContext.tsx` - Authentication and permissions
- `src/components/ProyectoWizard.tsx` - Main project creation workflow
- `app/(main)/proyectos/page.tsx` - Project listing with DataScroller
- `app/(main)/catalogos/page.tsx` - Catalog dashboard and navigation

## Common Debugging

**Mock issues**: Check `NEXT_PUBLIC_USE_MOCKS` environment variable
**Permission errors**: Verify user permissions in `MOCK_USERS` match required permissions
**Menu not activating**: Check `MenuContext` and route patterns in `AppMenuitem.tsx`
**TypeScript errors**: Ensure interfaces in `/types/` match actual data structures

## Documents generated by Copilot
- `docs_copilot/documentation` - Documentation generated by GitHub Copilot, examples, and guides
- `docs_copilot/prompts` - Saved prompt templates for Copilot usage