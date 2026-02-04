import { Signal } from '@preact/signals';
import { isEqual, safeJSONParse } from '@/utils/common';
import logger from '@/utils/logger';
import packageJson from '@/../package.json';

/**
 * Type for global app options.
 */
export interface AppOptions {
  theme?: string;
  debug?: boolean;
  showControlPanel?: boolean;
  panelPosition?: { x: number; y: number };
  disabledExtensions?: string[];
  dateTimeFormat?: string;
  filenamePattern?: string;
  language?: string;
  dedicatedDbForAccounts?: boolean;
  version?: string;
  autoStartCapture?: boolean;
  autoScrollEnabled?: boolean;
  autoScrollInterval?: number;
  autoScrollDistance?: number;
  autoScrollMaxAttempts?: number;
  autoScrollRandomness?: number;
  autoScrollPauseProbability?: number;
  autoScrollPauseDuration?: number;
  dateFilterEnabled?: boolean;
  dateFilterStartDate?: string | null;
  dateFilterEndDate?: string | null;
}

export const DEFAULT_APP_OPTIONS: AppOptions = {
  theme: 'orbit',
  debug: false,
  showControlPanel: true,
  panelPosition: { x: 32, y: 32 },
  disabledExtensions: [
    'HomeTimelineModule',
    'ListTimelineModule',
    'ListSubscribersModule',
    'ListMembersModule',
    'CommunityMembersModule',
    'CommunityTimelineModule',
    'RetweetersModule',
  ],
  dateTimeFormat: 'YYYY-MM-DD HH:mm:ss Z',
  filenamePattern: '{screen_name}_{id}_{type}_{num}_{date}.{ext}',
  language: '',
  dedicatedDbForAccounts: false,
  version: packageJson.version,
  autoStartCapture: true,
  autoScrollEnabled: false,
  autoScrollInterval: 2500,
  autoScrollDistance: 800,
  autoScrollMaxAttempts: 5,
  autoScrollRandomness: 0.4,
  autoScrollPauseProbability: 0.15,
  autoScrollPauseDuration: 3000,
  dateFilterEnabled: false,
  dateFilterStartDate: null,
  dateFilterEndDate: null,
};

export const THEMES = [
  'orbit',
] as const;

const LOCAL_STORAGE_KEY = packageJson.name;

/**
 * Persist app options to browser local storage.
 */
export class AppOptionsManager {
  private appOptions: AppOptions = { ...DEFAULT_APP_OPTIONS };
  private previous: AppOptions = { ...DEFAULT_APP_OPTIONS };

  /**
   * Signal for subscribing to option changes.
   */
  public signal = new Signal(0);

  constructor() {
    this.loadAppOptions();
  }

  public get<T extends keyof AppOptions>(key: T, defaultValue?: AppOptions[T]) {
    return this.appOptions[key] ?? defaultValue;
  }

  public set<T extends keyof AppOptions>(key: T, value: AppOptions[T]) {
    this.appOptions[key] = value;
    this.saveAppOptions();
  }

  /**
   * Read app options from local storage.
   */
  private loadAppOptions() {
    this.appOptions = {
      ...this.appOptions,
      ...safeJSONParse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}'),
    };

    const oldVersion = this.appOptions.version ?? '';
    const newVersion = DEFAULT_APP_OPTIONS.version ?? '';


    // Force theme to orbit if it's not valid
    if (!THEMES.includes(this.appOptions.theme as any)) {
      this.appOptions.theme = 'orbit';
      setTimeout(() => this.saveAppOptions(), 0);
    }

    // Migrate from v1.0 to v1.1.
    if (newVersion.startsWith('1.1') && oldVersion.startsWith('1.0')) {
      this.appOptions.disabledExtensions = [
        ...(this.appOptions.disabledExtensions ?? []),
        'HomeTimelineModule',
        'ListTimelineModule',
      ];
      logger.info(`App options migrated from v${oldVersion} to v${newVersion}`);
      setTimeout(() => this.saveAppOptions(), 0);
    }

    this.previous = { ...this.appOptions };
    logger.info('App options loaded', this.appOptions);
    this.signal.value++;
  }

  /**
   * Write app options to local storage.
   */
  private saveAppOptions() {
    const oldValue = this.previous;
    const newValue = {
      ...this.appOptions,
      version: packageJson.version,
    };

    if (isEqual(oldValue, newValue)) {
      return;
    }

    this.appOptions = newValue;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.appOptions));

    this.previous = { ...this.appOptions };
    logger.debug('App options saved', this.appOptions);
    this.signal.value++;
  }
}
