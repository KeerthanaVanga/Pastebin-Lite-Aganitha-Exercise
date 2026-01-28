import escapeHtml from "escape-html";

export const renderPasteHtml = (paste) => `
<!doctype html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <pre>${escapeHtml(paste.content)}</pre>
</body>
</html>
`;
