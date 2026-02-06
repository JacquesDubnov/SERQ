# SERQ - Comments





.claude/SESSION-HANDOVER.md



char space field in the toolbar - does not repflect the spacing value on cursor location in any given paragraph or block.


When assigning a heading style, the divided line color takes up the text color instead of the default color as presented on the modal.



it still flickers on the first entry, and I will tell you why. Because you need to deactivate text selection, not
  in relation only to the columns block. But globally, once we go into block drag mode, at that moment you
  deactivate completely text selection until there is a drop. So what happens is because you made it a code that is
  specific to the column block, then there is like a 1.5 or some like this that the drag hovers just enters into the
  columns block, and we still don't recognize that it is a drag operation. Within this time, it is still enabled
  the text selection. But you need to start the deactivation of the text selection from the moment the drag of the
  block is on.


