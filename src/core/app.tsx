import { Fragment } from 'preact';
import { useEffect, useRef, useCallback } from 'preact/hooks';
import { useSignal } from '@preact/signals';
import { IconX, IconPlayerPlay, IconPlayerStop, IconGripVertical } from '@tabler/icons-preact';
import { GM_registerMenuCommand } from '$';

import { ErrorBoundary } from '@/components/error-boundary';
import { CatIcon } from '@/components/common';
import { useTranslation } from '@/i18n';
import { cx } from '@/utils/common';
import logger from '@/utils/logger';

import extensionManager, { Extension } from './extensions';
import { Settings } from './settings';
import { options } from './options';
import { captureController } from './capture-controller';

export function App() {
  const { t } = useTranslation();

  const extensions = useSignal<Extension[]>([]);
  const currentTheme = useSignal(options.get('theme'));
  const showControlPanel = useSignal(options.get('showControlPanel'));
  const isCapturing = useSignal(captureController.isCapturing);
  const panelPosition = useSignal(options.get('panelPosition') ?? { x: 32, y: 32 });
  const isDragging = useSignal(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLElement>(null);

  // Drag handlers
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (panelRef.current) {
      isDragging.value = true;
      dragOffset.current = {
        x: e.clientX - panelPosition.value.x,
        y: e.clientY - panelPosition.value.y,
      };
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging.value) {
      const newX = Math.max(0, Math.min(window.innerWidth - 384, e.clientX - dragOffset.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.current.y));
      panelPosition.value = { x: newX, y: newY };
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isDragging.value) {
      isDragging.value = false;
      options.set('panelPosition', panelPosition.value);
    }
  }, []);

  // Remember the last state of the control panel.
  const toggleControlPanel = () => {
    showControlPanel.value = !showControlPanel.value;
    options.set('showControlPanel', showControlPanel.value);
  };

  // Update UI when extensions or options change.
  useEffect(() => {
    extensionManager.signal.subscribe(() => {
      extensions.value = extensionManager.getExtensions();
    });

    options.signal.subscribe(() => {
      currentTheme.value = options.get('theme');
    });

    captureController.signal.subscribe(() => {
      isCapturing.value = captureController.isCapturing;
    });

    // Add global mouse event listeners for dragging
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    GM_registerMenuCommand(t('Open Control Panel'), toggleControlPanel);

    logger.debug('App useEffect executed');

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <Fragment>
      {/* To show and hide the main UI. */}
      <div
        onClick={toggleControlPanel}
        data-theme={currentTheme.value}
        class="group w-12 h-12 fixed top-[60%] left-[-20px] cursor-pointer bg-transparent fill-base-content"
      >
        <div class="w-full h-full origin origin-[bottom_center] transition-all duration-200 group-hover:translate-x-[5px] group-hover:rotate-[20deg] opacity-50 group-hover:opacity-90">
          <CatIcon />
        </div>
      </div>
      {/* The main UI block. */}
      <section
        ref={panelRef}
        data-theme={currentTheme.value}
        style={{
          left: `${panelPosition.value.x}px`,
          top: `${panelPosition.value.y}px`,
          transform: showControlPanel.value ? 'none' : `translateX(calc(-100% - ${panelPosition.value.x + 32}px))`,
        }}
        class={cx(
          'glass-panel fixed border shadow-2xl w-96 leading-loose text-base-content px-6 py-6 rounded-box border-solid border-white/20 transition-transform duration-500',
          isDragging.value && 'cursor-grabbing select-none',
        )}
      >
        {/* Card title. */}
        <header class="flex items-center h-9 mb-1">
          {/* Drag handle */}
          <div
            onMouseDown={handleMouseDown}
            class="w-6 h-9 -ml-2 mr-1 cursor-grab flex justify-center items-center text-base-content/30 hover:text-base-content/60 transition-colors"
            title="Drag to move"
          >
            <IconGripVertical size={16} />
          </div>
          <div class="flex items-center gap-2 mr-auto">
            <svg viewBox="0 0 486 95" class="h-4 w-auto fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M61.0098 0C70.3398 0 78.73 1.01051 86.21 3.02051C93.6898 5.04047 100.05 8.02006 105.3 11.96C110.55 15.91 114.58 20.8204 117.4 26.6904C120.22 32.5702 121.63 39.3401 121.63 47.0098H121.62C121.62 54.6798 120.21 61.4601 117.39 67.3301C114.57 73.2101 110.54 78.1205 105.29 82.0605C100.04 86.0105 93.68 88.99 86.2002 91C78.7202 93.02 70.32 94.0205 61 94.0205C51.6802 94.0205 43.2604 93.0099 35.7305 91C28.2105 88.98 21.7998 86.0005 16.5098 82.0605C11.2198 78.1205 7.14027 73.2101 4.28027 67.3301C1.43028 61.4601 0 54.6898 0 47.0098C5.96627e-05 39.33 1.43014 32.5603 4.29004 26.6904C7.15001 20.8205 11.2296 15.9099 16.5195 11.96C21.8095 8.00996 28.2202 5.03051 35.7402 3.02051C43.2601 1.00055 51.6799 1.66274e-05 61.0098 0ZM192.89 2.27051C199.39 2.27051 204.91 2.94004 209.44 4.29004C213.97 5.63003 217.66 7.5408 220.5 10.0107C223.34 12.4807 225.4 15.4604 226.68 18.9502C227.96 22.4402 228.6 26.3302 228.6 30.6201C228.6 34.3901 228.07 37.6907 227.01 40.5107C225.95 43.3305 224.52 45.7509 222.72 47.7607C220.92 49.7805 218.83 51.4805 216.44 52.8604C214.061 54.2503 211.54 55.4006 208.9 56.3105L238.17 91.6201H209.94L182.89 58.71H156.55V91.6201L156.54 91.6299H132.41V2.27051H192.89ZM307.95 2.27051C310.51 2.27051 313.08 2.38059 315.66 2.60059C318.24 2.82059 320.7 3.21983 323.04 3.7998C325.38 4.3798 327.56 5.20023 329.58 6.24023C331.6 7.28014 333.35 8.65006 334.85 10.3398C336.35 12.0298 337.52 14.0702 338.36 16.4502C339.21 18.8302 339.63 21.6502 339.63 24.9102C339.63 30.7202 338.2 35.3305 335.34 38.7305C332.48 42.1304 327.969 44.4003 321.81 45.5303C326.14 45.8303 329.86 46.5007 332.96 47.5107C336.06 48.5307 338.59 49.92 340.54 51.6699C342.49 53.4299 343.92 55.5704 344.83 58.1104C345.74 60.6503 346.2 63.6103 346.2 66.9902L346.18 66.9805C346.18 70.4504 345.72 73.4606 344.81 76.0205C343.9 78.5804 342.63 80.7802 341.01 82.6201C339.39 84.4601 337.43 85.9604 335.16 87.1104C332.88 88.2603 330.37 89.1698 327.62 89.8398C324.87 90.5098 321.93 90.9802 318.81 91.2402C315.69 91.5002 312.46 91.6299 309.12 91.6299H244.28V2.27051H307.95ZM379.11 91.6299H354.98V2.27051H379.11V91.6299ZM485.94 21.7207H447.96V91.6201H423.83V21.71H385.91V2.27051H485.94V21.7207ZM61.0098 19.1807C56.1499 19.1807 51.8801 19.5603 48.2002 20.3203C44.5102 21.0803 41.3296 22.1307 38.6396 23.4707C35.9499 24.8107 33.6998 26.3908 31.8799 28.1807C30.06 29.9806 28.6095 31.9108 27.5195 33.9707C26.4397 36.0305 25.6699 38.1804 25.21 40.4102C24.75 42.64 24.5303 44.8399 24.5303 47.0098C24.5303 49.1797 24.76 51.4501 25.21 53.71C25.67 55.96 26.4295 58.1207 27.5195 60.1807C28.5995 62.2406 30.0599 64.1607 31.8799 65.9307C33.6998 67.7105 35.9499 69.2602 38.6396 70.5801C41.3296 71.9001 44.5102 72.9402 48.2002 73.7002C51.8801 74.4602 56.1599 74.8398 61.0098 74.8398C68.2496 74.8398 74.2097 74.0201 78.8896 72.3701C83.5696 70.7201 87.2705 68.5807 89.9805 65.9307C92.6904 63.2907 94.5796 60.3102 95.6396 56.9902C96.6996 53.6702 97.2305 50.3498 97.2305 47.0098C97.2304 43.6699 96.6996 40.3401 95.6396 37.0303C94.5796 33.7103 92.6904 30.7298 89.9805 28.0898C87.2705 25.4498 83.5696 23.3004 78.8896 21.6504C74.2097 20.0005 68.2496 19.1807 61.0098 19.1807ZM268.41 73.6699H303.271C306.52 73.6699 309.32 73.5598 311.66 73.3398C314 73.1199 315.91 72.6706 317.38 71.9707C318.85 71.2807 319.94 70.3101 320.63 69.0801C321.277 67.9176 321.625 66.4124 321.666 64.5479L321.67 64.1807C321.67 62.1407 321.32 60.5105 320.63 59.2705C319.94 58.0305 318.85 57.0802 317.38 56.4102C315.91 55.7402 314 55.2901 311.66 55.0801C309.32 54.8601 306.52 54.75 303.271 54.75H268.41V73.6699ZM156.54 40.0498H189.58C192.4 40.0498 194.75 39.8802 196.64 39.5303C198.52 39.1803 200.03 38.6301 201.16 37.8701C202.29 37.1101 203.08 36.1201 203.53 34.9102C203.98 33.7002 204.21 32.2202 204.21 30.4902C204.21 28.7603 203.98 27.2803 203.53 26.0703C203.07 24.8604 202.28 23.8703 201.16 23.1104C200.03 22.3504 198.53 21.8002 196.64 21.4502C194.75 21.1002 192.4 20.9307 189.58 20.9307H156.54V40.0498ZM268.4 37H303.97C306.4 37 308.39 36.7806 309.95 36.3506C311.51 35.9206 312.75 35.3298 313.66 34.5898C314.57 33.8499 315.2 32.9699 315.55 31.96C315.9 30.94 316.07 29.8702 316.07 28.7402C316.07 27.6103 315.9 26.5405 315.55 25.5205C315.2 24.5005 314.57 23.6003 313.66 22.8203C312.75 22.0404 311.51 21.4107 309.95 20.9307C308.39 20.4507 306.39 20.2207 303.97 20.2207H268.4V37Z" />
            </svg>
            <span class="text-xl font-thin tracking-widest text-base-content/80">
              EXPORTER
            </span>
          </div>
          <div
            onClick={toggleControlPanel}
            class="w-9 h-9 cursor-pointer flex justify-center items-center transition-colors duration-200 rounded-full hover:bg-base-200"
          >
            <IconX />
          </div>
        </header>


        {/* Start/Stop Capture Button */}
        <button
          onClick={() => captureController.toggle()}
          class={cx(
            'btn w-full mb-4 gap-2',
            isCapturing.value ? 'btn-error' : 'btn-primary',
          )}
        >
          {isCapturing.value ? (
            <>
              <IconPlayerStop size={20} />
              {t('Stop Capture')}
            </>
          ) : (
            <>
              <IconPlayerPlay size={20} />
              {t('Start Capture')}
            </>
          )}
        </button>

        {/* Scrollable Main Content */}
        <main class="overflow-y-auto max-h-[70vh] -mr-3 pr-3 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">

          {/* Section: Modules */}
          <div class="mb-6">
            <h3 class="text-xs font-bold text-base-content/50 uppercase tracking-widest mb-3 ml-1">{t('Modules')}</h3>
            <div class="grid grid-cols-2 gap-3">
              {extensions.value
                .filter((ext) => ext.name !== 'RuntimeLogsModule')
                .map((ext) => {
                  const Component = ext.render();
                  if (Component) {
                    return (
                      <ErrorBoundary>
                        <Component key={ext.name} extension={ext} />
                      </ErrorBoundary>
                    );
                  }
                  return null;
                })}
            </div>
          </div>

          {/* Section: Settings */}
          <div class="mb-4">
            <h3 class="text-xs font-bold text-base-content/50 uppercase tracking-widest mb-3 ml-1">{t('Settings')}</h3>
            <ErrorBoundary>
              <Settings />
            </ErrorBoundary>
          </div>

          {/* Section: Runtime Logs */}
          <div class="mb-4">
            {extensions.value
              .filter((ext) => ext.name === 'RuntimeLogsModule')
              .map((ext) => {
                const Component = ext.render();
                if (Component) {
                  return (
                    <ErrorBoundary>
                      <Component key={ext.name} extension={ext} />
                    </ErrorBoundary>
                  );
                }
                return null;
              })}
          </div>
        </main>
      </section>
    </Fragment>
  );
}
