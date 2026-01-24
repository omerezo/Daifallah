import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>جمعية ابناء ضيف الله الخيرية Logo</title>
      <path d="M 50, 95 C 20, 95, 20, 50, 20, 50 C 20, 20, 50, 20, 50, 20" fill="none" stroke="#A98B71" strokeWidth="16" strokeLinecap="round" transform="translate(0, -10)" />
      <path d="M 50, 95 C 80, 95, 80, 50, 80, 50 C 80, 20, 50, 20, 50, 20" fill="none" stroke="#A98B71" strokeWidth="16" strokeLinecap="round" transform="translate(0, -10)" />

      <circle cx="50" cy="42" r="30" fill="#A5A38D"/>

      <path d="M60 22 L60 32 L78 32 L78 50 L60 50 L60 62 L70 62" stroke="#E3B74A" strokeWidth="5" fill="none" />
      <path d="M64 41 L78 41" stroke="#D1A45A" strokeWidth="5" fill="none" />
      <path d="M70 22 L70 32" stroke="#D1A45A" strokeWidth="5" fill="none" />
      <path d="M60 55 L50 65" stroke="#D1A45A" strokeWidth="5" fill="none" />
      <path d="M50 22 L60 32" stroke="#C2926B" strokeWidth="5" fill="none" />

      <path d="M 48,60 A 20,20 0,0,0 22,60 L 22,50 L 48,50 Z" fill="#B5654D"/>
      <path d="M 35,32 L 22,50 L 48,50 L 35,32 Z" fill="none" stroke="#B5654D" strokeWidth="2"/>
      <path d="M 35,32 L 28,50" fill="none" stroke="#B5654D" strokeWidth="1.5"/>
      <path d="M 35,32 L 42,50" fill="none" stroke="#B5654D" strokeWidth="1.5"/>
      <path d="M 35,28 l -2,4 l 4,0 Z" fill="#B5654D"/>
      <rect x="32" y="50" width="6" height="10" fill="#3D383A" rx="2"/>
    </svg>
  );
}

export const logoBase64 = "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+2YfYsdmG2KfZhCDYs9mK2KrYs9mG2Yog2YTYs9mG2LDZhSDZiNmG2YXYqtmK2YYgTG9nbzwvdGl0bGU+PHBhdGggZD0iTSA1MCwgOTUgQyAyMCwgOTUsIDIwLCA1MCwgMjAsIDUwIEMgMjAsIDIwLCA1MCwgMjAsIDUwLCAyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQTk4QjcxIiBzdHJva2VXaWR0aD0iMTYiIHN0cm9rZUxpbmVjYXA9InJvdW5kIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLCAtMTApIiAvPjxwYXRoIGQ9Ik0gNTAsIDk1IEMgODAsIDk1LCA4MCwgNTAsIDgwLCA1MCBDIDgwLCAyMCwgNTAsIDIwLCA1MCwgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0E5OEI3MSIgc3Ryb2tlV2lkdGg9IjE2IiBzdHJva2VMaW5lY2FwPSJyb3VuZCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwgLTEwKSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjQyIiByPSIzMCIgZmlsbD0iI0E1QTM4RCIvPjxwYXRoIGQ9Ik02MCAyMiBMNjAgMzIgTDc4IDMyIEw3OCA1MCBMNjAgNTAgTDYwIDYyIEw3MCA2MiIgc3Ryb2tlPSIjRTNCNzRBIiBzdHJva2VXaWR0aD0iNSIgZmlsbD0ibm9uZSIgLz48cGF0aCBkPSJNNjQgNDEgTDc4IDQxIiBzdHJva2U9IiNEMUE0NUEiIHN0cm9rZVdpZHRoPSI1IiBmaWxsPSJub25lIiAvPjxwYXRoIGQ9Ik03MCAyMiBMNzAgMzIiIHN0cm9rZT0iI0QxQTQ1QSIgc3Ryb2tlV2lkdGg9IjUiIGZpbGw9Im5vbmUiIC8+PHBhdGggZD0iTTYwIDU1IEw1MCA2NSIgc3Ryb2tlPSIjRDFBNDVBIiBzdHJva2VXaWR0aD0iNSIgZmlsbD0ibm9uZSIgLz48cGF0aCBkPSJNNTAgMjIgTDYwIDMyIiBzdHJva2U9IiNDMjkyNkIiIHN0cm9rZVdpZHRoPSI1IiBmaWxsPSJub25lIiAvPjxwYXRoIGQ9Ik0gNDgsNjAgQSAyMCwyMCAwLDAsMCAyMiw2MCBMIDIyLDUwIEwgNDgsNTAgWiIgZmlsbD0iI0I1NjU0RCIvPjxwYXRoIGQ9Ik0gMzUsMzIgTCAyMiw1MCBMIDQ4LDUwIEwgMzUsMzIgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQjU2NTREIiBzdHJva2VXaWR0aD0iMiIvPjxwYXRoIGQ9Ik0gMzUsMzIgTCAyOCw1MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQjU2NTREIiBzdHJva2VXaWR0aD0iMS41Ii8+PHBhdGggZD0iTSAzNSwzMiBMIDQyLDUwIiBmaWxsPSJub25lIiBzdHJva2U9IiNCNTY1NEQiIHN0cm9rZVdpZHRoPSIxLjUiLz48cGF0aCBkPSJNIDM1LDI4IGwgLTIsNCBsIDQsMCBaIiBmaWxsPSIjQjU2NTREIi8+PHJlY3QgeD0iMzIiIHk9IjUwIiB3aWR0aD0iNiIgaGVpZHRoPSIxMCIgZmlsbD0iIzNEMzgzQSIgcng9IjIiLz48L3N2Zz4=";
