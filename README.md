# WDR5 Foundation website

A responsive, dependency-free static website designed for GitHub Pages.

## Publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload every file and folder in this directory to the repository root.
3. In GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, choose **GitHub Actions**.
5. Push to the `main` branch. The included workflow deploys the site.

## Website admin

Open `admin.html` on the published site. Enter:

- the repository as `owner/repository`
- the branch, normally `main`
- the content path, normally `data/updates.json`
- the homepage numbers path, normally `data/site-settings.json`
- a fine-grained GitHub personal access token with **Contents: Read and write** access to this repository

The token is kept in session storage only and is not committed to the site. Publishing edits `data/updates.json` and `data/site-settings.json` through the GitHub API, which triggers a new Pages deployment.

The homepage "Families Registered" and "Countries" numbers are controlled from the **Homepage numbers** section in the admin page.

For greater security and multiple editors, replace this browser-token workflow with a server-backed CMS or GitHub App before inviting a larger team.

## Contact and registration forms

GitHub Pages cannot receive form submissions by itself. The forms work in preview mode and save test submissions in the current browser. To receive live submissions, add a service endpoint such as Formspree to each form's `data-endpoint` attribute.

## Images

The logo, world map, feature strip, homepage illustrations and update thumbnails are extracted from the supplied design reference. The inner-page global connection banner was generated specifically for this project using the built-in image-generation workflow.
