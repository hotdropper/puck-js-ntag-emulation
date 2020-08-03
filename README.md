# Use

### Load a file
`npm run load <file>`

### Open console
`npm start`

### Expected layout

main file goes in: `src/{target}/app.js`

Additional files go in `src/{target}/{subdir}/{file}`

### Build

`gulp --target original rollup`

puts a file in `dist/original/app.js`

### Upload

`gulp --target original upload`

uploads `dist/original/app.js` to your puck

### One-shot

`gulp --target original`

builds `dist/original/app.js` and uploads it.
