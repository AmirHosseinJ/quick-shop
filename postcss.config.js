import { purgeCSSPlugin } from '@fullhuman/postcss-purgecss';

export default {
    plugins: [
        purgeCSSPlugin({
            content: [
                "./src/**/*.html",  // HTML files
                "./src/**/*.tsx",   // React/TSX files
                "./src/**/*.jsx",   // React/JSX files
                "./src/**/*.ts",    // TypeScript files
                "./src/**/*.js",    // JavaScript files
            ],
            safelist: [
                /^navbar/,         // Bootstrap classes to preserve (e.g., navbar)
                /^btn/,            // Button-related classes
                /^card/,           // Card-related classes
                /^alert/,          // Alert-related classes
                /^modal/,          // Modal-related classes
                /^dropdown/,       // Dropdown-related classes
                /^collapse/,       // Collapse-related classes
                /^container/,      // Container classes
                // Add any other Bootstrap classes used dynamically
            ],
            defaultExtractor: content => {
                return content.match(/[A-Za-z0-9-_:/]+/g) || [];
            }
        })
    ]
};
