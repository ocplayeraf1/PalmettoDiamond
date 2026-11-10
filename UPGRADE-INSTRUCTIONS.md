# Upgrade your existing Palmetto Diamond website to Version 6

**Use the V6 CODE-ONLY ZIP for your live GitHub website. It does not contain `site-data.json`, so your entered schools, games, scores, photos, and stories can be kept.**

## First, protect what you've already entered

1. Open your existing public Palmetto Diamond website, then open its editor (`?edit=1#admin`).
2. If you've been entering teams and schedules but haven't made those changes public, visit **Publish data** and publish them to GitHub (or export the new public `site-data.json` and upload it to GitHub manually).
3. Download a private backup from the editor. In your GitHub repository, click your current `site-data.json`, then download a separate backup of it.
4. Keep those backups privately. Do not publish a private backup: it may include drafts.

## Upload Version 6

1. Download **palmetto-diamond-v6-code-only-upgrade.zip** and select **Extract All** on your Windows computer.
2. Go to your repository at `github.com/YOUR-USERNAME/palmetto-diamond` (or your actual repository name).
3. From the repository's main **Code** tab, select **Add file → Upload files**.
4. Drag these seven files into GitHub's upload area: `index.html`, `styles.css`, `league-v6.css`, `app.js`, `publish.js`, `enhancements.js`, and `league-v6.js`. Upload at the top level of the repository, not inside an extra folder.
5. Commit your changes on the branch used by GitHub Pages, normally `main`.
6. Do **not** remove or replace `site-data.json`, `.nojekyll`, or your `assets/` folder. Do **not** upload a full new-install package over your live repository.
7. When deployment completes, open your website and press **Ctrl + Shift + R**. You can check the Actions tab or Settings → Pages if it doesn't appear immediately.

## Use the new controls

- **SCISA schools:** Teams → Add school → State = SC → Association = SCISA → set classification, region, colors and logo → Save. For a school already added, open the team page and click Edit this team page.
- **Directories:** Teams → All SC schools, SCHSL, SCISA, Out-of-state, or Everything.
- **Region standings:** Standings → All South Carolina, SCHSL, or SCISA. These are separate tables.
- **Compact color scoreboards:** Scores → filter by association, school, class, tournament or season. Dates automatically run earliest to latest; each school is backed by its primary color.
- **Team schedules:** Teams → school → Schedule. Dates are earliest to latest.
- **Ranking lists:** Rankings → choose combined statewide, SCHSL or SCISA lists.
- **Saving updates publicly:** Site editor → Publish data. Saving a school or score on your browser alone does not update the public site for other visitors.

**Note:** Existing South Carolina schools without an Association field are treated as SCHSL until you explicitly change them. No actual team affiliation is verified automatically.

**Privacy:** `?edit=1` is a browser editing mode, not a login. Keep your GitHub credentials and publishing token private. This upgrade has not been pushed to your live account automatically.
