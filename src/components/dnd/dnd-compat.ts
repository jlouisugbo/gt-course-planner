import * as React from 'react';

// Minimal connector type compatible with react-dnd connectors and similar libs
export type DnDConnector = (element: HTMLElement | null) => void;

// Attach a drag/drop connector to a forwarded ref in a type-safe way
export function attachConnectorRef<T extends HTMLElement>(
  connector: DnDConnector,
  forwardedRef?: React.Ref<T>
): React.RefCallback<T> {
  return (node: T | null) => {
    // First pass the element to the DnD connector
    connector(node as unknown as HTMLElement | null);

    // Then forward the ref to consumers
    if (!forwardedRef) return;
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
    } else {
      try {
        (forwardedRef as React.MutableRefObject<T | null>).current = node;
      } catch {
        // ignore write errors on non-writable refs
      }
    }
  };
}

// Helper to merge multiple refs into a single callback ref
export function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') ref(node);
      else {
        try {
          (ref as React.MutableRefObject<T | null>).current = node;
        } catch {
          // ignore
        }
      }
    }
  };
}
