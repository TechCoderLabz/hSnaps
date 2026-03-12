/**
 * Poll API service: fetch poll status and results from hivehub.dev.
 */

const POLLS_BASE = 'https://polls.hivehub.dev/rpc/poll'

export interface PollChoiceVotes {
  total_votes: number
  hive_hp: number
  hive_proxied_hp: number
  hive_hp_incl_proxied: number
  spl_spsp: number
  he_token: number | null
  colony_colonyp: number
  glx_glxp: number
}

export interface PollChoiceResult {
  choice_num: number
  choice_text: string
  votes: PollChoiceVotes | null
}

export interface PollVoter {
  name: string
  choices: number[]
  hive_hp: number
  hive_proxied_hp: number
  hive_hp_incl_proxied: number
}

export interface PollStats {
  total_voting_accounts_num: number
  total_hive_hp: number
  total_hive_proxied_hp: number
  total_hive_hp_incl_proxied: number
}

export interface PollApiResponse {
  post_title: string
  post_body: string
  author: string
  created: string
  permlink: string
  parent_permlink: string
  parent_author: string
  category: string
  tags: string[]
  image: string[] | null
  protocol_version: number
  question: string
  preferred_interpretation: string
  token: string | null
  end_time: string
  status: 'Active' | 'Finished'
  max_choices_voted: number
  filter_account_age_days: number
  ui_hide_res_until_voted: boolean
  community_membership: string | null
  allow_vote_changes: boolean
  platform: string
  poll_trx_id: string
  poll_choices: PollChoiceResult[]
  poll_voters: PollVoter[] | null
  poll_stats: PollStats | null
}

/** Fetch poll data from the hivehub polls API. Returns null if not found. */
export async function fetchPollResults(
  author: string,
  permlink: string,
  signal?: AbortSignal,
): Promise<PollApiResponse | null> {
  const url = `${POLLS_BASE}?author=eq.${encodeURIComponent(author)}&permlink=eq.${encodeURIComponent(permlink)}`
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json, text/plain, */*' },
      signal,
    })
    if (!res.ok) return null
    const data: PollApiResponse[] = await res.json()
    return data.length > 0 ? data[0] : null
  } catch {
    return null
  }
}
