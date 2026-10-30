import { type TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  isAvailable(): boolean;
  startConsent(sender: string | null): Promise<string>;
  startRetriever(): Promise<string>;
  stop(): void;
  getAppHash(): Promise<string>;
}

export default TurboModuleRegistry.get<Spec>('OTPKit');
