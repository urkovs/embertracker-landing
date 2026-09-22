# Site illustration review

Local website candidate, not published. Use the restrained line-art palette established on Plus. No generated product screenshots, numerical examples, animation, or external image dependencies.

| Page | Decision |
| --- | --- |
| Home | Keep real app screenshots, videos, report, and existing explanatory icons. Replace the repeated orb in the Plus callout with its pattern illustration. |
| Plus | Keep four feature illustrations and expandable device illustrations. |
| Providers | Add one document-to-phone illustration to explain Provider Handoff. Keep real report images, clinical engine, and app captures. |
| Clinic enrollment | Add one phone-to-inbox illustration beside the direct-send introduction. |
| Contact | Add one small conversation illustration above the introduction. Form unchanged. |
| 404 | Add one small return-home illustration. Correct narrow navigation wrapping. |
| Privacy / Terms | Keep text-focused legal documents; pictures would not clarify the terms. |
| References | Keep readable source citations without decorative images. |
| Delete account | Keep instructions and deletion choices unobstructed. |
| Send report | Keep the app-opening action immediately accessible. |
| Clinic QR | Retain existing orb and functional QR code. |
| Provider Handoff tool | Preserve the working form and existing action icons. Explain the flow on the provider landing page instead. |
| Beta / Provider update | Retain legacy purpose and existing assets; no new decoration. |

Four reusable SVGs live in `assets/illustrations/`. New styles are scoped to the illustration class, with narrow navigation wrapping for pages loading the stylesheet. Image dimensions prevent layout jumps. Decorative images use empty alternative text; explanatory flows have descriptive alternatives.

Validation: parsed all new SVGs, checked local image paths and alt attributes, checked diff whitespace, reviewed contact and enrollment desktop placement and all four additions at narrow width. All new images loaded. The provider page's existing report strip has internal scrolling; its narrow document reported 10px overflow during review, so this is not a claim of a complete responsive audit. No form submission or clinical-engine changes.
