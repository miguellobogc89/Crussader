import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.crussader.app",
  appName: "Crussader",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
};

export default config;
