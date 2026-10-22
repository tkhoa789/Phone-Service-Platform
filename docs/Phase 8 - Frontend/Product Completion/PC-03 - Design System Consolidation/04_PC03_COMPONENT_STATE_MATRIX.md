# PC-03 COMPONENT STATE MATRIX

Every interactive component must explicitly support and test the following states to ensure compliance.

| Component | Default | Hover | Active/Pressed | Focus | Disabled | Error | Loading |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Button** | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ |
| **Input** | ✅ | ✅ | N/A | ✅ | ✅ | ✅ | N/A |
| **Textarea** | ✅ | ✅ | N/A | ✅ | ✅ | ✅ | N/A |
| **Select** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| **Checkbox** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| **Radio** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |

### State Behaviors
- **Hover:** Slight scale-up (`scale-[1.02]`) on Buttons/Cards to indicate interactivity.
- **Active:** Scale-down (`scale-95`) + Inset Shadow to simulate pressing a physical button into a soft surface.
- **Focus:** Emerald Ring (`ring-emerald-500/50`) purely for keyboard navigation accessibility.
- **Error:** Red Border (`border-rose-500/50`) + Red Text for labels.
- **Loading:** Button text becomes a spinner (`Loader2 animate-spin`); Inputs remain disabled.
