// Decompressed and reconstructed data structure
export class UserDataDto {
  plugins: Record<string, { enabled: boolean; storage?: string }>;
  themes: Record<string, { enabled: boolean }>;
  fonts: {
    installed: Record<string, { enabled: boolean }>;
    custom: {
      spec: number;
      name: string;
      previewText?: string;
      main: Record<string, string>;
      enabled: boolean;
    }[];
  };
}
