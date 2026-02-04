import { JSX } from 'preact';
import { useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { IconArrowUpRight, IconSearch, IconX } from '@tabler/icons-preact';

import { useTranslation } from '@/i18n';
import { Media } from '@/types';
import { formatTwitterImage } from '@/utils/api';
import { cx, formatVideoDuration } from '@/utils/common';

import { ErrorBoundary } from './error-boundary';

// #region ExtensionPanel

type ExtensionPanelProps = {
  title: string;
  description: string;
  active?: boolean;
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  onClick?: () => void;
  children?: JSX.Element | JSX.Element[];
  indicatorColor?: string;
};

/**
 * Common template for an extension panel.
 */
export function ExtensionPanel({
  title,
  description,
  children,
  onClick,
  active,
  enabled,
  onToggle,
  indicatorColor = 'bg-secondary',
}: ExtensionPanelProps) {
  return (
    <section class={cx('module-panel', !enabled && 'opacity-60 grayscale')}>
      {/* Card contents. */}
      <div
        class="group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-200 hover:bg-base-content/5 active:scale-[0.98]"
        onClick={(e) => {
          // Prevent click when toggling
          if ((e.target as HTMLElement).tagName === 'INPUT') return;
          if (enabled && onClick) onClick();
        }}
      >
        <div class="flex items-center min-w-0 flex-grow mr-2">
          {/* Status Dot - Only show if active (has data) */}
          {active && enabled && (
            <div class="relative flex h-2 w-2 mr-2 shrink-0">
              <span
                class={cx(
                  'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                  indicatorColor,
                )}
              />
              <span
                class={cx('relative inline-flex rounded-full h-2 w-2', indicatorColor)}
              />
            </div>
          )}

          <div class="flex flex-col min-w-0">
            <p class="text-sm font-bold leading-tight truncate transition-colors mb-0.5">
              {title}
            </p>
            <p class="text-[10px] text-base-content/60 leading-tight truncate">
              {description}
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        {onToggle && (
          <input
            type="checkbox"
            class="toggle toggle-xs toggle-primary shrink-0"
            checked={enabled}
            onChange={(e) => onToggle((e.target as HTMLInputElement).checked)}
          />
        )}

        {/* Fallback Action Button (if no toggle but enabled) */}
        {!onToggle && enabled && (
          <button class="btn btn-sm btn-circle btn-ghost opacity-0 group-hover:opacity-100 transition-opacity">
            <IconArrowUpRight size={18} />
          </button>
        )}
      </div>
      {/* Modal entries. */}
      {enabled && children}
    </section>
  );
}

// #region Modal

type ModalProps = {
  show?: boolean;
  onClose?: () => void;
  children?: JSX.Element | JSX.Element[];
  title?: string;
  class?: string;
};

/**
 * Common template for modals.
 * Uses createPortal to render to body, escaping any container constraints.
 */
export function Modal({ show, onClose, title, children, class: className }: ModalProps) {
  if (!show) {
    return null;
  }

  // Force fixed positioning to escape any container constraints
  const overlayStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  };

  const boxStyle = {
    maxWidth: '800px',
    width: '90vw',
    maxHeight: '85vh',
    overflow: 'auto',
  };

  const modalContent = (
    <div style={overlayStyle} onClick={onClose}>
      <div
        class={cx('modal-box p-3 flex flex-col', className)}
        style={boxStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <header class="flex items-center h-9 mb-2 shrink-0">
          <div
            onClick={onClose}
            class="w-9 h-9 mr-2 cursor-pointer flex justify-center items-center transition-colors duration-200 rounded-full hover:bg-base-200"
          >
            <IconX />
          </div>
          <h2 class="leading-none text-xl m-0 font-semibold">{title}</h2>
        </header>
        <ErrorBoundary>{children}</ErrorBoundary>
      </div>
    </div>
  );

  // Use portal to render modal to #twe-root, keeping DaisyUI styles applied
  const portalTarget = document.getElementById('twe-root') || document.body;
  return createPortal(modalContent, portalTarget);
}

// #region SearchArea

type SearchAreaProps = {
  defaultValue?: string;
  onChange: (value: string) => void;
};

/**
 * Common template for global table filter.
 */
export function SearchArea({ defaultValue, onChange }: SearchAreaProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div class="join justify-end my-[2px] w-full max-w-[50%] absolute top-3 right-3">
      <input
        ref={inputRef}
        type="text"
        class="input input-bordered input-sm join-item max-w-[calc(100%-46px)]"
        placeholder={t('Search...')}
        defaultValue={defaultValue}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onChange(inputRef.current?.value ?? '');
          }
        }}
      />
      <button class="btn btn-sm join-item" onClick={() => onChange(inputRef.current?.value ?? '')}>
        <IconSearch size={20} />
      </button>
    </div>
  );
}

// #region MultiSelect

type MultiSelectProps<T> = {
  class?: string;
  options: { label: string; value: T }[];
  selected: T[];
  onChange: (value: T[]) => void;
};

export function MultiSelect<T extends string>(props: MultiSelectProps<T>) {
  const { options, selected, onChange } = props;

  const onInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.checked) {
      onChange([...new Set([...selected, target.value as T])]);
    } else {
      onChange(selected.filter((value) => value !== target.value));
    }
  };

  return (
    <div class={cx('dropdown', props.class)}>
      <div
        tabIndex={0}
        class="input input-bordered input-sm flex flex-row items-center space-x-1 cursor-pointer"
      >
        {options
          .filter((option) => selected.includes(option.value))
          .map((option) => (
            <div key={option.value} class="badge badge-accent select-none">
              {option.label}
            </div>
          ))}
      </div>
      <ul
        tabIndex={0}
        class="dropdown-content menu menu-sm z-10 w-full rounded-box bg-base-100 p-2 shadow"
      >
        {options.map((option) => (
          <li key={option.value}>
            <label class="label cursor-pointer justify-start">
              <input
                type="checkbox"
                class="checkbox checkbox-accent checkbox-sm"
                value={option.value}
                checked={selected.includes(option.value)}
                onChange={onInputChange}
              />
              <span class="label-text ml-1">{option.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

// #region Columns

type MediaDisplayColumnProps = {
  data: Media[];
  onClick: (media: Media) => void;
};

export function MediaDisplayColumn({ data, onClick }: MediaDisplayColumnProps) {
  return (
    <div class="flex flex-row items-start space-x-1 w-max">
      {data.map((media) => (
        <div
          key={media.media_key ?? media.id_str}
          class="flex-shrink-0 block cursor-pointer relative w-12 h-12 rounded bg-base-300 overflow-hidden"
          onClick={() => onClick(media)}
        >
          <img
            class="w-full h-full object-cover"
            src={formatTwitterImage(media.media_url_https, 'thumb')}
            alt={media.ext_alt_text || ''}
            title={media.ext_alt_text || ''}
          />
          {/* Show video duration or GIF. */}
          {media.type !== 'photo' && (
            <div class="absolute bottom-0.5 left-0.5 h-4 w-max px-0.5 text-xs text-white bg-black bg-opacity-30 leading-4 text-center rounded">
              {media.type === 'video'
                ? formatVideoDuration(media.video_info?.duration_millis)
                : 'GIF'}
            </div>
          )}
          {/* Or show ALT text if any. */}
          {media.type === 'photo' && media.ext_alt_text && (
            <div class="absolute bottom-0.5 left-0.5 h-4 w-max px-0.5 text-xs text-white bg-black bg-opacity-30 leading-4 text-center rounded">
              ALT
            </div>
          )}
        </div>
      ))}
      {data.length ? null : 'N/A'}
    </div>
  );
}

// #region Icons

/**
 * Orbit logo icon used as the trigger button.
 */
export const OrbitIcon = () => (
  <svg viewBox="0 0 122 95" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
    <path d="M61.0098 0C70.3398 0 78.73 1.01051 86.21 3.02051C93.6898 5.04047 100.05 8.02006 105.3 11.96C110.55 15.91 114.58 20.8204 117.4 26.6904C120.22 32.5702 121.63 39.3401 121.63 47.0098H121.62C121.62 54.6798 120.21 61.4601 117.39 67.3301C114.57 73.2101 110.54 78.1205 105.29 82.0605C100.04 86.0105 93.68 88.99 86.2002 91C78.7202 93.02 70.32 94.0205 61 94.0205C51.6802 94.0205 43.2604 93.0099 35.7305 91C28.2105 88.98 21.7998 86.0005 16.5098 82.0605C11.2198 78.1205 7.14027 73.2101 4.28027 67.3301C1.43028 61.4601 0 54.6898 0 47.0098C5.96627e-05 39.33 1.43014 32.5603 4.29004 26.6904C7.15001 20.8205 11.2296 15.9099 16.5195 11.96C21.8095 8.00996 28.2202 5.03051 35.7402 3.02051C43.2601 1.00055 51.6799 1.66274e-05 61.0098 0ZM61.0098 19.1807C56.1499 19.1807 51.8801 19.5603 48.2002 20.3203C44.5102 21.0803 41.3296 22.1307 38.6396 23.4707C35.9499 24.8107 33.6998 26.3908 31.8799 28.1807C30.06 29.9806 28.6095 31.9108 27.5195 33.9707C26.4397 36.0305 25.6699 38.1804 25.21 40.4102C24.75 42.64 24.5303 44.8399 24.5303 47.0098C24.5303 49.1797 24.76 51.4501 25.21 53.71C25.67 55.96 26.4295 58.1207 27.5195 60.1807C28.5995 62.2406 30.0599 64.1607 31.8799 65.9307C33.6998 67.7105 35.9499 69.2602 38.6396 70.5801C41.3296 71.9001 44.5102 72.9402 48.2002 73.7002C51.8801 74.4602 56.1599 74.8398 61.0098 74.8398C68.2496 74.8398 74.2097 74.0201 78.8896 72.3701C83.5696 70.7201 87.2705 68.5807 89.9805 65.9307C92.6904 63.2907 94.5796 60.3102 95.6396 56.9902C96.6996 53.6702 97.2305 50.3498 97.2305 47.0098C97.2304 43.6699 96.6996 40.3401 95.6396 37.0303C94.5796 33.7103 92.6904 30.7298 89.9805 28.0898C87.2705 25.4498 83.5696 23.3004 78.8896 21.6504C74.2097 20.0005 68.2496 19.1807 61.0098 19.1807Z" />
  </svg>
);

/**
 * @deprecated Use OrbitIcon instead.
 * @license
 * Credit: https://icooon-mono.com/12776-%e7%8c%ab%e3%81%ae%e7%84%a1%e6%96%99%e3%82%a2%e3%82%a4%e3%82%b3%e3%83%b32/
 */
export const CatIcon = OrbitIcon;
