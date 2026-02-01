# SERQ - Comments


From 07-01 (Columns):
~~  1. Type /2col to insert 2-column layout - columns appear
~~  2. Type /3col or /4col to insert 3 or 4 columns
~~  3. Drag resize handles between columns to adjust widths
~~  4. Type content in each column independently
~~  5. Insert any block type (lists, callouts, code) inside columns
~~
  From 07-02 (Float/Text Wrap):
 ~~ 1. Right-click an image - see float options in context menu
  2. Select "Float Left" - image floats left, text wraps on right
  3. Select "Float Right" - image floats right, text wraps on left
  4. Insert a heading after floated element - heading clears the float
  5. Right-click a callout - see same float options
  6. Float a callout - text wraps around it~~

  From 07-03 (Free Positioning):
  1. Drag an image - see animated glow drop cursor
  2. Right-click image and select "Free Positioning" - image becomes absolutely positioned
  3. Drag a free-positioned image - moves freely within canvas
  4. Try to drag outside canvas - constrained to bounds
  5. Disable free positioning - image returns to document flow

  From 07-04 (Line Numbers):
  1. Right-click on empty canvas space (below content) - see Line Numbers menu
  2. Enable line numbers - numbers appear in left gutter
  3. Switch to "margin" position - numbers move inside canvas
  4. Switch to "legal" style - only every 5th line numbered
  5. Add/remove text - line numbers update

  From 07-05 (Paragraph Numbering):
  1. Right-click canvas - see Paragraph Numbering section
  2. Open preset picker - see category tabs (Sequential, Hierarchical, Legal)
  3. Select "Numbers (1, 2, 3)" - paragraphs get numbered
  4. Add headings, select hierarchical preset - nested numbering (1.1, 1.2)
  5. Select legal preset - see Article/Section/Clause format
  6. Disable numbering - numbers disappear

  That's about 20+ tests. Let me consolidate to the most important user-observable ones.




  Okay, let's create a standard font management on the toolbar. Just like in Word or in Google Docs, add drop-downs of:
- Font name
- Font size
- Font type (bold, semi-bold, regular, thin, light etc. As per each font)
Add buttons to increase and decrease font sizes.
Make sure the system can support the top 30 fonts used by Google Fonts. Make a research and make sure that we have access to the top 30 Google Fonts from our font menu with all their weights and variations.

When selecting a text and applying the font style, size, and type on that selected text, this will override the paragraph, heading, and other block instructions to this particular selected text.

Obviously, there will be no representation of this in Markdown unless you know how to do it in Markdown. So it can only be represented if exported as HTML, Word, EPUB, etc. So when saving as Markdown, we need to warn the user that Markdown format does not save individual fonts.

go.