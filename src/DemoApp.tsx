import { useEffect } from 'react';
import { generateDemo } from './demo/generate';
import { useAtlas } from './store/atlas';
import { createDemoRepo } from './store/demoRepo';
import { AtlasShell } from './components/AtlasShell';

export function DemoApp() {
  useEffect(() => {
    const { set } = useAtlas.getState();
    set({ data: generateDemo(), status: 'ready', error: null });
    set({ repo: createDemoRepo() });
    document.title = 'jobbot · demo territory';
  }, []);

  return (
    <AtlasShell
      badge={
        <span
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] text-muted"
          title="Real companies; contacts are nameless role placeholders. Your changes reset when you reload."
        >
          <span className="h-1.5 w-1.5 rounded-full bg-ok" aria-hidden />
          Demo · sample data
        </span>
      }
    />
  );
}
