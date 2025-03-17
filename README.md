# ExcelClone

A simple spreadsheet demo built with React, showcasing large-scale grid rendering and basic formula support (addition only).

## Tech Stack
	
- React
- react-window – for virtual scrolling, enabling efficient rendering of up to 10,000×10,000 cells
- JavaScript (ES6+)
- Custom Hooks – e.g., useDebouncedResize to handle window resizing

## Features
	
1.	Virtual Scrolling
- Displays a grid with up to 100 million cells without overloading the DOM.
  
2.	Cell Editing
- Click a cell to edit its contents directly or use the Formula Bar at the top.

3.	Basic Formulas (Addition Only)
- Example: =A1+B2 to sum multiple cells.
- Automatically recalculates when referenced cells change.

4.	Row/Column Headers
- Top row displays column labels (A, B, C, …).
- Left column shows row numbers (1, 2, 3, …).

5.	Keyboard Navigation
- Enter confirms edits and moves to the next row.
- Tab confirms edits and moves to the next column.

6.	Responsive Resize
- The grid’s height and width adjust dynamically as the browser window is resized.

## Getting Started

1.	Install dependencies
`npm install`

2.	Run the development server
`npm start`

3.	Open your browser
`Navigate to http://localhost:3000`