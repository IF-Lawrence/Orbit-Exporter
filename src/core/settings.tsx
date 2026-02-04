import { Fragment } from 'preact';
import { useEffect } from 'preact/hooks';
import { useSignal } from '@preact/signals';
import {
  IconBrandGithubFilled,
  IconHelp,
  IconDatabaseExport,
  IconTrashX,
  IconReportAnalytics,
  IconPlayerPlay,
  IconPlayerStop,
} from '@tabler/icons-preact';
import { GM_registerMenuCommand } from '$';

import packageJson from '@/../package.json';
import { useTranslation, detectBrowserLanguage, LANGUAGES_CONFIG, TranslationKey } from '@/i18n';
import { capitalizeFirstLetter, cx } from '@/utils/common';
import { saveFile } from '@/utils/exporter';

import { db } from './database';
import extensionManager from './extensions';
import { DEFAULT_APP_OPTIONS, options } from './options';
import { autoScroller } from '@/utils/auto-scroller';
import { dateRangeFilter } from '@/utils/date-filter';
import { captureController } from './capture-controller';

export function Settings() {
  const { t, i18n } = useTranslation();


  const autoScrollRunning = useSignal(autoScroller.isRunning());

  const styles = {
    subtitle: 'mb-2 text-base-content ml-4 opacity-50 font-semibold text-xs',
    block:
      'text-sm mb-2 w-full flex px-4 py-2 text-base-content bg-base-200 rounded-box justify-between',
    item: 'label cursor-pointer flex justify-between h-8 items-center p-0',
  };

  useEffect(() => {
    GM_registerMenuCommand(`${t('Version')} ${packageJson.version}`, () => {
      window.open(packageJson.homepage, '_blank');
    });

    // Sync auto-scroller configuration (but don't auto-start on page load)
    // Always set enabled to false to prevent auto-start after page refresh
    autoScroller.updateConfig({
      enabled: false, // Never auto-start on page load
      interval: options.get('autoScrollInterval') ?? 2500,
      distance: options.get('autoScrollDistance') ?? 800,
      maxScrollAttempts: options.get('autoScrollMaxAttempts') ?? 5,
      randomness: options.get('autoScrollRandomness') ?? 0.4,
      pauseProbability: options.get('autoScrollPauseProbability') ?? 0.15,
      pauseDuration: options.get('autoScrollPauseDuration') ?? 3000,
    });

    // Clear the enabled flag in options if it was set
    if (options.get('autoScrollEnabled')) {
      options.set('autoScrollEnabled', false);
    }

    // Sync date range filter configuration
    dateRangeFilter.updateConfig({
      enabled: options.get('dateFilterEnabled') ?? false,
      startDate: options.get('dateFilterStartDate') ?? null,
      endDate: options.get('dateFilterEndDate') ?? null,
      stopOnOutOfRange: true,
    });

    // Auto-start capture if enabled
    captureController.initAutoStart(options.get('autoStartCapture') ?? true);

    // Subscribe to auto-scroller state changes
    autoScroller.signal.subscribe(() => {
      autoScrollRunning.value = autoScroller.isRunning();
    });
  }, []);

  return (
    <div class="flex flex-col gap-2 p-1">
      {/* Date range filter settings. */}
      {(() => {
        const isExpanded = useSignal(false);
        return (
          <div class="collapse collapse-arrow bg-base-200">
            <input
              type="checkbox"
              checked={isExpanded.value}
              onChange={(e) => isExpanded.value = (e.target as HTMLInputElement).checked}
            />
            <div class="collapse-title flex items-center gap-2 pr-12 min-h-12 py-3">
              <span class="font-medium flex-1">{t('Date Range Filter')}</span>
              <input
                type="checkbox"
                class="toggle toggle-primary toggle-sm z-10"
                checked={options.get('dateFilterEnabled')}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const enabled = (e.target as HTMLInputElement)?.checked;
                  options.set('dateFilterEnabled', enabled);
                  dateRangeFilter.updateConfig({ enabled });
                }}
              />
            </div>
            <div class="collapse-content flex flex-col gap-2">
              <div class="flex items-center text-xs opacity-70 mb-2">
                <IconHelp size={16} class="mr-1" />
                {t('Only save and capture tweets within the specified date range.')}
              </div>
              <label class={styles.item}>
                <span class="label-text whitespace-nowrap">{t('Start Date')}</span>
                <input
                  type="date"
                  class="input input-bordered input-xs w-40"
                  value={options.get('dateFilterStartDate') || ''}
                  onChange={(e) => {
                    const startDate = (e.target as HTMLInputElement)?.value || null;
                    options.set('dateFilterStartDate', startDate);
                    dateRangeFilter.updateConfig({ startDate });
                  }}
                />
              </label>
              <label class={styles.item}>
                <span class="label-text whitespace-nowrap">{t('End Date')}</span>
                <input
                  type="date"
                  class="input input-bordered input-xs w-40"
                  value={options.get('dateFilterEndDate') || ''}
                  onChange={(e) => {
                    const endDate = (e.target as HTMLInputElement)?.value || null;
                    options.set('dateFilterEndDate', endDate);
                    dateRangeFilter.updateConfig({ endDate });
                  }}
                />
              </label>
              <div class={styles.item}>
                <span class="label-text whitespace-nowrap text-xs opacity-70">
                  {dateRangeFilter.isActive()
                    ? `${t('Active')}: ${dateRangeFilter.getDescription()}`
                    : t('Inactive')}
                </span>
                <button
                  class="btn btn-xs btn-ghost"
                  onClick={() => {
                    options.set('dateFilterStartDate', null);
                    options.set('dateFilterEndDate', null);
                    dateRangeFilter.updateConfig({ startDate: null, endDate: null });
                  }}
                >
                  {t('Clear Dates')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Auto-scroll settings. */}
      {(() => {
        const isExpanded = useSignal(false);
        return (
          <div class="collapse collapse-arrow bg-base-200 mt-2">
            <input
              type="checkbox"
              checked={isExpanded.value}
              onChange={(e) => isExpanded.value = (e.target as HTMLInputElement).checked}
            />
            <div class="collapse-title flex items-center gap-2 pr-12 min-h-12 py-3">
              <span class="font-medium flex-1">{t('Auto-Scroll')}</span>
              <input
                type="checkbox"
                class="toggle toggle-primary toggle-sm z-10"
                checked={options.get('autoScrollEnabled')}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const enabled = (e.target as HTMLInputElement)?.checked;
                  options.set('autoScrollEnabled', enabled);
                  autoScroller.updateConfig({ enabled });
                  // If enabling, ensure section is expanded to show controls if desired, 
                  // or keep it collapsed as per user request for "default folded".
                  // Let's keep it simple and just toggle the feature.
                }}
              />
            </div>
            <div class="collapse-content flex flex-col gap-2">
              <div class="flex items-center text-xs opacity-70 mb-2">
                <IconHelp size={16} class="mr-1" />
                {t('Automatically scroll to load more content.')}
              </div>
              <label class={styles.item}>
                <span class="label-text whitespace-nowrap">{t('Scroll Interval (ms)')}</span>
                <input
                  type="number"
                  class="input input-bordered input-xs w-24"
                  min="1000"
                  max="10000"
                  step="100"
                  value={options.get('autoScrollInterval')}
                  onChange={(e) => {
                    const interval = parseInt((e.target as HTMLInputElement)?.value) || 2500;
                    options.set('autoScrollInterval', interval);
                    autoScroller.updateConfig({ interval });
                  }}
                />
              </label>
              <label class={styles.item}>
                <span class="label-text whitespace-nowrap">{t('Scroll Distance (px)')}</span>
                <input
                  type="number"
                  class="input input-bordered input-xs w-24"
                  min="200"
                  max="2000"
                  step="100"
                  value={options.get('autoScrollDistance')}
                  onChange={(e) => {
                    const distance = parseInt((e.target as HTMLInputElement)?.value) || 800;
                    options.set('autoScrollDistance', distance);
                    autoScroller.updateConfig({ distance });
                  }}
                />
              </label>
              <label class={styles.item}>
                <div class="flex items-center">
                  <span class="label-text whitespace-nowrap">{t('Randomness')}</span>
                </div>
                <input
                  type="number"
                  class="input input-bordered input-xs w-24"
                  min="0"
                  max="1"
                  step="0.05"
                  value={options.get('autoScrollRandomness')}
                  onChange={(e) => {
                    const randomness = parseFloat((e.target as HTMLInputElement)?.value) || 0.4;
                    options.set('autoScrollRandomness', randomness);
                    autoScroller.updateConfig({ randomness });
                  }}
                />
              </label>
              <label class={styles.item}>
                <div class="flex items-center">
                  <span class="label-text whitespace-nowrap">{t('Pause Probability')}</span>
                </div>
                <input
                  type="number"
                  class="input input-bordered input-xs w-24"
                  min="0"
                  max="1"
                  step="0.05"
                  value={options.get('autoScrollPauseProbability')}
                  onChange={(e) => {
                    const pauseProbability =
                      parseFloat((e.target as HTMLInputElement)?.value) || 0.15;
                    options.set('autoScrollPauseProbability', pauseProbability);
                    autoScroller.updateConfig({ pauseProbability });
                  }}
                />
              </label>
              <label class={styles.item}>
                <span class="label-text whitespace-nowrap">{t('Pause Duration (ms)')}</span>
                <input
                  type="number"
                  class="input input-bordered input-xs w-24"
                  min="1000"
                  max="10000"
                  step="500"
                  value={options.get('autoScrollPauseDuration')}
                  onChange={(e) => {
                    const pauseDuration = parseInt((e.target as HTMLInputElement)?.value) || 3000;
                    options.set('autoScrollPauseDuration', pauseDuration);
                    autoScroller.updateConfig({ pauseDuration });
                  }}
                />
              </label>
              <label class={styles.item}>
                <span class="label-text whitespace-nowrap">{t('Max Attempts')}</span>
                <input
                  type="number"
                  class="input input-bordered input-xs w-24"
                  min="1"
                  max="20"
                  step="1"
                  value={options.get('autoScrollMaxAttempts')}
                  onChange={(e) => {
                    const maxScrollAttempts = parseInt((e.target as HTMLInputElement)?.value) || 5;
                    options.set('autoScrollMaxAttempts', maxScrollAttempts);
                    autoScroller.updateConfig({ maxScrollAttempts });
                  }}
                />
              </label>
            </div>
          </div>
        );
      })()}
      {/* Common settings. */}
      {(() => {
        const isExpanded = useSignal(false);
        return (
          <div class="collapse collapse-arrow bg-base-200 mt-2">
            <input
              type="checkbox"
              checked={isExpanded.value}
              onChange={(e) => isExpanded.value = (e.target as HTMLInputElement).checked}
            />
            <div class="collapse-title flex items-center pr-4 min-h-12 py-3">
              <span class="font-medium">{t('General')}</span>
            </div>
            <div class="collapse-content flex flex-col gap-2">

              <label class={styles.item}>
                <span class="label-text whitespace-nowrap">{t('Language')}</span>
                <select
                  class="select select-xs max-w-[150px]"
                  onChange={(e) => {
                    const language = (e.target as HTMLSelectElement)?.value ?? detectBrowserLanguage();
                    i18n.changeLanguage(language);
                    options.set('language', language);
                  }}
                >
                  {Object.entries(LANGUAGES_CONFIG).map(([langTag, langConf]) => (
                    <option
                      key={langTag}
                      value={langTag}
                      selected={options.get('language') === langTag}
                    >
                      {langConf.nameEn} - {langConf.name}
                    </option>
                  ))}
                </select>
              </label>
              <label class={styles.item}>
                <span class="label-text whitespace-nowrap">{t('Debug')}</span>
                <input
                  type="checkbox"
                  class="toggle toggle-primary toggle-sm"
                  checked={options.get('debug')}
                  onChange={(e) => {
                    options.set('debug', (e.target as HTMLInputElement)?.checked);
                  }}
                />
              </label>
              <label class={styles.item}>
                <div class="flex items-center">
                  <span class="label-text whitespace-nowrap">{t('Auto Start Capture')}</span>
                  <a
                    class="tooltip tooltip-bottom ml-0.5 before:max-w-40"
                    data-tip={t(
                      'Automatically start capturing tweets when page loads. Recommended to keep enabled.',
                    )}
                  >
                    <IconHelp size={16} />
                  </a>
                </div>
                <input
                  type="checkbox"
                  class="toggle toggle-primary toggle-sm"
                  checked={options.get('autoStartCapture') ?? true}
                  onChange={(e) => {
                    options.set('autoStartCapture', (e.target as HTMLInputElement)?.checked);
                  }}
                />
              </label>
              <label class={styles.item}>
                <div class="flex items-center">
                  <span class="label-text whitespace-nowrap">{t('Date Time Format')}</span>
                  <a
                    href="https://day.js.org/docs/en/display/format"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="tooltip tooltip-bottom ml-0.5 before:max-w-40"
                    data-tip={t(
                      'Click for more information. This will take effect on both previewer and exported files.',
                    )}
                  >
                    <IconHelp size={16} />
                  </a>
                </div>
                <input
                  type="text"
                  class="input input-bordered input-xs w-48"
                  value={options.get('dateTimeFormat')}
                  onChange={(e) => {
                    options.set('dateTimeFormat', (e.target as HTMLInputElement)?.value);
                  }}
                />
              </label>
              {/* Database operations. */}
              <label class={styles.item}>
                <div class="flex items-center">
                  <span class="label-text whitespace-nowrap">{t('Use dedicated DB for accounts')}</span>
                  <a
                    class="tooltip tooltip-bottom ml-0.5 before:max-w-40"
                    data-tip={t(
                      'This will create separate database for each Twitter account, which can help reduce the chance of data mixing when you use multiple accounts.',
                    )}
                  >
                    <IconHelp size={16} />
                  </a>
                </div>
                <input
                  type="checkbox"
                  class="toggle toggle-primary toggle-sm"
                  checked={options.get('dedicatedDbForAccounts')}
                  onChange={(e) => {
                    options.set('dedicatedDbForAccounts', (e.target as HTMLInputElement)?.checked);
                  }}
                />
              </label>
            </div>
          </div>
        );
      })()}

      {/* Local Database settings. */}
      {(() => {
        const isExpanded = useSignal(false);
        return (
          <div class="collapse collapse-arrow bg-base-200 mt-2">
            <input
              type="checkbox"
              checked={isExpanded.value}
              onChange={(e) => isExpanded.value = (e.target as HTMLInputElement).checked}
            />
            <div class="collapse-title flex items-center pr-4 min-h-12 py-3">
              <span class="font-medium">{t('Local Database')}</span>
            </div>
            <div class="collapse-content flex flex-col gap-2">
              <div class="flex gap-2 justify-center py-2">
                <button
                  class="btn btn-sm btn-neutral flex items-center gap-1"
                  onClick={async () => {
                    let storageUsageText = 'Storage usage: N/A';
                    if (typeof navigator.storage.estimate === 'function') {
                      const { quota = 1, usage = 0 } = await navigator.storage.estimate();
                      const usageMB = (usage / 1024 / 1024).toFixed(2);
                      const quotaMB = (quota / 1024 / 1024).toFixed(2);
                      storageUsageText = `Storage usage: ${usageMB}MB / ${quotaMB}MB`;
                    }

                    const count = await db.count();
                    alert(
                      storageUsageText +
                      '\n\nIndexedDB tables count:\n' +
                      JSON.stringify(count, undefined, '  '),
                    );
                  }}
                >
                  <IconReportAnalytics size={16} />
                  {t('Analyze DB')}
                </button>
                <button
                  class="btn btn-sm btn-primary flex items-center gap-1"
                  onClick={async () => {
                    const blob = await db.export();
                    if (blob) {
                      saveFile(`orbit-exporter-${Date.now()}.json`, blob);
                    }
                  }}
                >
                  <IconDatabaseExport size={16} />
                  {t('Export DB')}
                </button>
                <button
                  class="btn btn-sm btn-warning flex items-center gap-1"
                  onClick={async () => {
                    if (confirm(t('Are you sure to clear all data in the database?'))) {
                      const success = await db.clear();
                      if (success) {
                        alert(t('Database cleared.'));
                      } else {
                        alert(t('Error:') + ' Failed to clear database. Check console for details.');
                      }
                    }
                  }}
                >
                  <IconTrashX size={16} />
                  {t('Clear DB')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}


    </div>
  );
}
