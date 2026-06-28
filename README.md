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
5. Leave the editable page content path as `data/page-content.json`.
6. Leave the image upload folder as `assets/images/uploads`, unless you want admin uploads saved somewhere else.
7. Enter a fine-grained GitHub personal access token with **Contents: Read and write** access to this repository.
8. Select **Connect and load from GitHub**.
9. Edit page content, update posts, homepage numbers, or upload images.
10. Select the section's **Save draft** button.
11. Select **Publish live changes to GitHub**.

The token is kept in session storage only and is not committed to the site. Publishing edits `data/updates.json`, `data/site-settings.json` and `data/page-content.json` through the GitHub API, which triggers a new Pages deployment.

The homepage "Families Registered" and "Countries" numbers are controlled from the **Homepage numbers** section in the admin page.

Most static page text is controlled from the **Edit pages** section in the admin page and stored in `data/page-content.json`. Choose a page from the dropdown, edit its fields, save the page-content draft, then publish.

The editable page system uses small `data-cms` markers in the HTML files. If page-content edits publish successfully but do not appear on the public site, upload the latest HTML pages, `assets/js/site.js`, and `data/page-content.json` from this project. Donation amounts are included as editable fields in the Donate page editor.

Update posts use one shared data file:

- the **Tile summary** appears on the updates page and homepage latest-updates panel
- the **Tile image** is used only for smaller cards and thumbnails
- the optional **Full article header image** appears large at the top of the article page
- the **Full article body** appears on `update.html?id=post-id`
- blank lines in the article body become paragraphs
- lines beginning with `##` become headings
- lines beginning with `-` become bullet points
- uploaded body images are saved in `assets/images/uploads/` and inserted using `![Alt text](assets/images/uploads/example.jpg "Optional caption")`

The admin image uploader requires the GitHub repository and private update key. Uploading an image commits the image file immediately into the configured image upload folder; after it is inserted into a post, select **Save update draft** and then **Publish live changes to GitHub** so the public article points to that image.

Use the **Image library** panel in `admin.html` to avoid typing image paths manually. Select **Refresh image list** after connecting to GitHub. Each image shows its exact repo path and buttons to:

- copy the path
- insert the image into the article body
- use it as the full article header image
- use it as the tile image

If you see a GitHub error saying `"sha" wasn't supplied`, update `assets/js/admin.js` from this project. The admin now automatically fetches the required GitHub file ID before publishing existing JSON files.

For greater security and multiple editors, replace this browser-token workflow with a server-backed CMS or GitHub App before inviting a larger team.

## Contact and registration forms

GitHub Pages cannot receive form submissions by itself. The forms work in preview mode and save test submissions in the current browser. To receive live submissions, add a service endpoint such as Formspree to each form's `data-endpoint` attribute.

## Images

The logo, world map, feature strip, homepage illustrations and update thumbnails are extracted from the supplied design reference. The inner-page global connection banner was generated specifically for this project using the built-in image-generation workflow.
