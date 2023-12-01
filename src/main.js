/* eslint-disable eslint-comments/no-duplicate-disable */
/* eslint-disable prettier/prettier */
/* eslint-disable github/array-foreach */
/* eslint-disable no-shadow */
/* eslint-disable prettier/prettier */
const core = require('@actions/core')
const github = require('@actions/github')
const { Context } = require('@actions/github/lib/context')

async function run() {
  try {
    // Get token from the user input
    const token = core.getInput('token', { required: true })
    // Get context and octokit instance
    const context = new Context()
    const srcPrUrl = context.payload.pull_request.html_url
    const octokit = github.getOctokit(token)

    // Request the timeline
    const timeline = await octokit.request(
      `GET /repos/{owner}/{repo}/issues/{issue_number}/timeline`,
      {
        ...context.repo,
        issue_number: context.issue.number,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    )
    // Filter the cross-references
    const crossRefs = timeline.data.filter(
      elem => elem.event === 'cross-referenced'
    )
    // Check every box (if existing) in each PR
    crossRefs.forEach(async elem => {
      const comments_url = elem.source.issue.comments_url
      const issue_number = elem.source.issue.number
      const repo_name = elem.source.issue.repository.name
      const repo_owner = elem.source.issue.repository.owner.login
      // Fetch all comments of the referencing PRs
      if (!('pull_request' in elem.source.issue)) return
      const comments = await octokit.request(`GET ${comments_url}`, {
        owner: repo_owner,
        repo: repo_name,
        issue_number,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })

      const regexpFrom = new RegExp(
        `- \\[ \\](\\s+?.*?(${srcPrUrl}).*?)$`,
        'gm'
      )
      const replaceString = `- [X]$1`

      comments.data.forEach(async comment => {
        const commentBody = comment.body
        const newCommentBody = commentBody.replaceAll(regexpFrom, replaceString)
        await octokit.request(`PATCH ${comment.url}`, {
          owner: repo_owner,
          repo: repo_name,
          comment_id: comment.id,
          body: newCommentBody,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        })
      })
    })
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
