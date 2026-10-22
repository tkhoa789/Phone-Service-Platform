# PC-09A Receipt Print QA Report

## Physical Print Contract
- Component `PosK80Receipt.tsx` was migrated **as-is** regarding its HTML structure and inline Tailwind classes.
- The wrapper `div` utilizes `no-print` for control buttons.
- Dimensions remain locked to K80 thermal standards.
- Visual inspection confirms typography, line wrapping, and Vietnamese encoding are preserved.
