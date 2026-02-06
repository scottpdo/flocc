declare interface EnvironmentOptions {
  torus?: boolean;
  width?: number;
  height?: number;
  /** Optional scheduler for controlling agent activation timing. @since 0.6.0 */
  scheduler?: any;
  /** Optional event bus for publish-subscribe messaging. @since 0.6.0 */
  events?: any;
}
