//@ts-ignore
import * as deviceMetricStyles from "bundle-text:../css/device-metrics.css";

function loadDeviceMetricsStyles() {
  try {
    const o = document.createElement("style");
    o.textContent = deviceMetricStyles;
    o.className = "safepay-drops-DeviceMetrics";
    window.drops.styleChunks.DeviceMetrics = o;
  } catch (o) {
    console.error(
      o,
      "Unable to add CardLink styles to the window using the corresponding js file",
    );
  }
}

function loadDeviceMetricsJsChunks() {
  try {
    window.drops.jsChunkImports.DeviceMetrics = ["index", "SeamlessIframe"];
  } catch (o) {
    console.error(
      o,
      "Unable to add CardLink style imports to the window using the corresponding js file",
    );
  }
}

export function loadDeviceMetricsStylesAndJsChunks() {
  loadDeviceMetricsStyles();
  loadDeviceMetricsJsChunks();
}
