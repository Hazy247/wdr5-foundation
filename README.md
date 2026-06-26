# WDR5 Foundation website

A responsive, dependency-free static website designed for GitHub Pages.

## Publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload every file and folder in this directory to the repository root.
3. In GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, choose **GitHub Actions**.
5. Push to the `main` branch. The included workflow deploys the site.

## Website admin

Open `admin.html` on the published site. The admin page is not linked from the public footer, but it is still a public URL on GitHub Pages. Visitors cannot publish changes unless they have your private GitHub update key.

To save live updates:

1. Enter the GitHub repository as `owner/repository`.
2. Enter the branch, normally `main`.
3. Leave the updates path as `data/updates.json`.
4. Leave the homepage numbers path as `data/site-settings.json`.
5. Enter a fine-grained GitHub personal access token with **Contents: Read and write** access to this repository.
6. Select **Connect and load from GitHub**.
7. Edit update posts or homepage numbers.
8. Select the section's **Save draft** button.
9. Select **Publish live changes to GitHub**.

The token is kept in session storage only and is not committed to the site. Publishing edits `data/updates.json` and `data/site-settings.json` through the GitHub API, which triggers a new Pages deployment.

The homepage "Families Registered" and "Countries" numbers are controlled from the **Homepage numbers** section in the admin page.

Update posts use one shared data file:

- the **Tile summary** appears on the updates page and homepage latest-updates panel
- the **Full article body** appears on `update.html?id=post-id`
- blank lines in the article body become paragraphs
- lines beginning with `##` become headings
- lines beginning with `-` become bullet points

For greater security and multiple editors, replace this browser-token workflow with a server-backed CMS or GitHub App before inviting a larger team.

## Contact and registration forms

GitHub Pages cannot receive form submissions by itself. The forms work in preview mode and save test submissions in the current browser. To receive live submissions, add a service endpoint such as Formspree to each form's `data-endpoint` attribute.

## Images

The logo, world map, feature strip, homepage illustrations and update thumbnails are extracted from the supplied design reference. The inner-page global connection banner was generated specifically for this project using the built-in image-generation workflow.
