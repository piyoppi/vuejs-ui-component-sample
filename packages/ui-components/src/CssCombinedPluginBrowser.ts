export const getCombinedCss = (modulePath: string) => `.combined_css_${modulePath} {}`

export const getCombinedCssPromise = (modulePath: string) => Promise.resolve(`.combined_css_${modulePath} {}`)
