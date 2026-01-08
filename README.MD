\# Markdown Memo Templates



A companion extension for \*\*Markdown Memo\*\* that automatically creates notes with:



\- Rule-based file routing

\- Template files with variable substitution

\- Frontmatter generation

\- Template inheritance (`baseTemplate` + `{{content}}`)

\- Custom variables from user settings

\- A command to preview variable substitution

\- Optional debug logging



---



\## Features



\### Rule-based routing



Each rule matches a note title (from a wiki link like `\[\[My Note]]`) using a regular expression and defines:



\- \*\*`pattern`\*\* – regex matched against the note title  

\- \*\*`path`\*\* – folder (relative to workspace) where the note is created  

\- \*\*`template`\*\* – template file name  

\- \*\*`templateFolder`\*\* – optional override for where templates are loaded from  

\- \*\*`baseTemplate`\*\* – optional base template that wraps the main template and exposes a `{{content}}` slot  

\- \*\*`frontmatter`\*\* – optional object merged into generated frontmatter  



Rules are evaluated in order; the first match wins.



---



\### Template variables



You can use these variables in templates and frontmatter:



\- \*\*`{{title}}`\*\* – note title  

\- \*\*`{{slug}}`\*\* – URL‑safe version of the title  

\- \*\*`{{date}}`\*\* – local date  

\- \*\*`{{time}}`\*\* – local time  

\- \*\*`{{isoDate}}`\*\* – ISO timestamp  

\- \*\*`{{createdAt}}`\*\* – timestamp at file creation  

\- \*\*`{{year}}`\*\* – 4‑digit year  

\- \*\*`{{month}}`\*\* – 2‑digit month  

\- \*\*`{{day}}`\*\* – 2‑digit day  



Plus any \*\*custom variables\*\* defined in `memoTemplates.customVariables`:



```jsonc

"memoTemplates.customVariables": {

&nbsp; "author": "Your Name",

&nbsp; "company": "Acme Corp"

}



