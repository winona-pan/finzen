/* 正式版（npm run build）用的 JSX runtime：先翻譯文字再交給 React（說明見 i18nRuntime.js） */
import { jsx as _jsx, jsxs as _jsxs, Fragment } from "react/jsx-runtime";
import { translateProps } from "./i18nRuntime";
export { Fragment };
export function jsx(type, props, key) { return _jsx(type, translateProps(type, props), key); }
export function jsxs(type, props, key) { return _jsxs(type, translateProps(type, props), key); }
