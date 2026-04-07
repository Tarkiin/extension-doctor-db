# Privacy Policy - Extension Doctor

**Last Updated:** April 2026

## Overview

**Extension Doctor** is a transparency and security tool designed to analyze the permissions of your installed Google Chrome extensions. We believe in absolute privacy: **your data belongs to you**.

## Data Collection

**We do not collect, transmit, or store any personal data.**

Extension Doctor operates entirely **locally** on your device. All analysis of extensions, including their permissions and heuristic risk scoring, occurs directly within your browser. 

We do not have analytics, tracking pixels, or remote servers collecting information about you or the extensions you have installed.

## Remote Knowledge Base (Optional)

In the extension's Options, you can optionally enable the "Consultar base de conocimiento remota" (Query remote knowledge base) feature. 

When enabled:
- The extension will periodically download a static JSON file (`extensions.json`) from our public GitHub repository. 
- **This process is a one-way download.** We **do not** send your list of installed extensions or any identifying information to GitHub or any other server. The local application simply downloads the database and performs the cross-referencing on your local machine.

## Third-Party Services 

If you choose to export your extension analysis data using the "Export" feature, the resulting file (JSON or CSV) is generated locally and saved to your device's storage. It is never uploaded to any remote server by our extension.

Extension Doctor interacts with Google Chrome APIs (Manifest V3) exclusively to read the metadata of your installed extensions as part of its core functionality.

## Changes to this Privacy Policy
We may update this Privacy Policy from time to time. Any changes will be reflected in this document and published alongside the extension's source code on our GitHub repository. Since we do not collect your information, we cannot notify you directly of any changes.

## Contact

Since Extension Doctor is an open-source project, you can review the entire source code to verify our privacy claims. If you have any questions or want to report an issue, please visit our public GitHub repository: [https://github.com/Tarkiin/extension-doctor-db](https://github.com/Tarkiin/extension-doctor-db).
