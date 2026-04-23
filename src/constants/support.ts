/**
 * Shared support, vote, and supporters data for Settings and Landing.
 */
export const SUPPORT_DISCORD_URL = 'https://discord.gg/WEKa8JKg7W'
export const VOTE_WITNESS_URL = 'https://vote.hive.uno/@sagarkothari88'

export const SUPPORTERS = [
  {
    title: 'Powered by Hive.io',
    description: 'Explore the Hive blockchain',
    avatar: 'https://images.hive.blog/u/hiveio/avatar',
    link: 'https://hive.io/',
    buttonText: 'Visit',
    color: 'bg-[#e31337] hover:bg-[#c51231]',
  },
  {
    title: 'Cheered by @starkerz',
    description: 'Community supporter',
    avatar: 'https://images.hive.blog/u/starkerz/avatar',
    link: '/@starkerz',
    buttonText: 'View',
    color: 'bg-emerald-600 hover:bg-emerald-700',
  },
  {
    title: 'Encouraged by @theycallmedan',
    description: 'Hive advocate & supporter',
    avatar: 'https://images.hive.blog/u/theycallmedan/avatar',
    link: '/@theycallmedan',
    buttonText: 'View',
    color: 'bg-amber-600 hover:bg-amber-700',
  },
  {
    title: 'Github',
    description: "It's all open source",
    avatar: 'https://images.hive.blog/0x0/https://avatars.githubusercontent.com/u/259840578?s=200&v=4',
    link: 'https://github.com/orgs/TechCoderLabz/repositories',
    buttonText: 'View',
    color: 'bg-[#e31337] hover:bg-[#c51231]',
  },
  {
    title: 'Inspired by @peakd\'s Snaps',
    description: 'Great Dev @asgarth\'s Peakd-Snaps',
    avatar: 'https://images.hive.blog/u/asgarth/avatar',
    link: '/@asgarth',
    buttonText: 'View',
    color: 'bg-blue-600 hover:bg-blue-700',
  },
] as const
