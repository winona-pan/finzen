/* 開發模式（npm run dev）用的 JSX runtime：先翻譯文字再交給 React（說明見 i18nRuntime.js） */
import { jsxDEV as _jsxDEV, Fragment } from "react/jsx-dev-runtime";
import { translateProps } from "./i18nRuntime";
export { Fragment };
export function jsxDEV(type, props, key, isStatic, source, self) { return _jsxDEV(type, translateProps(type, props), key, isStatic, source, self); }
