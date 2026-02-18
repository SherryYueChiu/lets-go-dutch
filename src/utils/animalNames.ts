// 隨機鳥類名稱和emoji列表
export const ANIMALS = [
  { name: '小鳥', emoji: '🐦' },
  { name: '雞', emoji: '🐔' },
  { name: '鴨', emoji: '🦆' },
  { name: '企鵝', emoji: '🐧' },
  { name: '老鷹', emoji: '🦅' },
  { name: '貓頭鷹', emoji: '🦉' },
  { name: '火雞', emoji: '🦃' },
  { name: '鴿子', emoji: '🕊️' },
  { name: '鸚鵡', emoji: '🦜' },
  { name: '天鵝', emoji: '🦢' },
  { name: '孔雀', emoji: '🦚' },
  { name: '蜂鳥', emoji: '🐤' },
  { name: '小雞', emoji: '🐥' },
  { name: '小鴨', emoji: '🐣' },
] as const

/**
 * 获取随机动物名称和emoji
 */
export function getRandomAnimal(): { name: string; emoji: string } {
  const randomIndex = Math.floor(Math.random() * ANIMALS.length)
  return ANIMALS[randomIndex]
}

/**
 * 检查动物名称是否已被使用
 */
export function isAnimalNameUsed(
  name: string,
  usedNames: string[]
): boolean {
  return usedNames.includes(name)
}

/**
 * 获取未使用的随机动物名称
 */
export function getUnusedRandomAnimal(
  usedNames: string[]
): { name: string; emoji: string } {
  const availableAnimals = ANIMALS.filter(
    animal => !usedNames.includes(animal.name)
  )
  
  if (availableAnimals.length === 0) {
    // 如果所有名称都用过了，返回随机一个
    return getRandomAnimal()
  }
  
  const randomIndex = Math.floor(Math.random() * availableAnimals.length)
  return availableAnimals[randomIndex]
}
