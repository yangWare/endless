import materialConfig from '../../config/material_config.json'
import i18nConfig from '../../config/i18n_config.json'

/**
 * 计算锻造成功率
 * @param {number} forgerLevel - 锻造师等级，每级增加10%成功率
 * @param {number} toolLevel - 工具等级，每级增加5%成功率
 * @param {number} materialLevel - 材料等级，每级增加3%成功率
 * @returns {number} 返回最终成功率
 *
 * 计算规则：
 * 1. 基础成功率为50%
 * 2. 锻造师成功率为(1 + 等级 * 0.1)
 * 3. 工具成功率为(1 + 等级 * 0.05)
 * 4. 材料成功率为(1 + 等级 * 0.03)
 * 5. 最终成功率 = 基础成功率 * 锻造师成功率 * 工具成功率 * 材料成功率
 */
const calculateForgeSuccess = (forgerLevel, toolLevel, materialLevel = 0) => {
  // 计算锻造师等级与工具等级的差值
  const levelDiff = forgerLevel - toolLevel

  // 计算锻造师成功率
  let forgerRate
  // 锻造师等级小于锻造工具3级，说明驾驭不了工具，成功率归0
  if (levelDiff < -3) {
    forgerRate = 0
  // 锻造师等级大于锻造工具6级，说明完美驾驭，取最高2倍率
  } else if (levelDiff > 3) {
    forgerRate = 2
  } else {
    // 中间区间使用线性插值计算锻造师成功率（-3到3级之间）
    // 将-3到3的范围映射到0到2的范围
    forgerRate = (levelDiff + 3) / 3
  }

  // 计算工具等级与材料等级的差值
  const toolDiff = toolLevel - materialLevel

  // 计算工具成功率
  let toolRate
  if (toolDiff < -3) {
    toolRate = 0
  } else if (toolDiff > 3) {
    toolRate = 1
  } else {
    // 中间区间使用线性插值计算工具成功率（-3到3级之间）
    // 将-3到3的范围映射到0到1的范围
    toolRate = (toolDiff + 3) / 6
  }

  // 基础成功率为50%
  const baseRate = 0.5

  // 计算最终成功率
  return Math.min(Math.max(baseRate * forgerRate * toolRate, 0), 1)
}

/**
 * 根据锻造师等级和工具等级计算装备等级
 * @param {number} forgerLevel - 锻造师等级
 * @param {number} toolLevel - 工具等级
 * @param {number} maxSuccessRate - 最高材料成功率
 * @returns {string} 返回装备等级
 */
const calculateEquipmentLevel = (forgerLevel, toolLevel, maxSuccessRate) => {
  // 获取所有可能的等级
  const levels = Object.keys(i18nConfig.equipment_levels)
  
  // 计算随机数
  const random = Math.random()
  let cumulativeChance = 0
  
  // 先根据概率确定基础等级
  let baseLevel = 'common'
  for (const level of levels) {
    const levelConfig = i18nConfig.equipment_levels[level]
    cumulativeChance += levelConfig.chance
    
    if (random <= cumulativeChance) {
      baseLevel = level
      break
    }
  }
  
  // 根据成功率进行降级判定
  if (maxSuccessRate < 0.7) {
    // 成功率低于70%时，史诗及以上等级需要二次判定
    if (['epic', 'legendary', 'mythic'].includes(baseLevel)) {
      if (Math.random() > 0.5) {
        return 'rare' // 降级为精良
      }
    }
  } else if (maxSuccessRate < 0.8) {
    // 成功率低于80%时，传说和神话需要二次判定
    if (['legendary', 'mythic'].includes(baseLevel)) {
      if (Math.random() > 0.5) {
        return 'epic' // 降级为史诗
      }
    }
  } else if (maxSuccessRate < 0.9) {
    // 成功率低于90%时，神话需要二次判定
    if (baseLevel === 'mythic') {
      if (Math.random() > 0.5) {
        return 'legendary' // 降级为传说
      }
    }
  }
  
  return baseLevel
}

/**
 * 生成装备名称
 * @param {string} equipmentType - 装备类型
 * @param {Array<Object>} materials - 材料列表，每个材料包含materialId和materialLevel
 * @param {string} level - 装备等级
 * @returns {string} 返回生成的装备名称
 */
const generateEquipmentName = (equipmentType, materials, level) => {
  const type = i18nConfig.equipment_position[equipmentType]
  const levelConfig = i18nConfig.equipment_levels[level]
  const prefix = levelConfig.name

  // 找出等级最高的材料
  const maxLevelMaterial = materials.reduce((max, current) => 
    current.materialLevel > max.materialLevel ? current : max
  )

  // 获取最高等级材料的名称
  let materialName = '未知'
  for (const type in materialConfig.material_types) {
    const materials = materialConfig.material_types[type].materials
    if (materials[maxLevelMaterial.materialId]) {
      materialName = materials[maxLevelMaterial.materialId].name
      break
    }
  }

  return `${prefix}${materialName}${type.name}`
}

/**
 * 计算材料属性加成
 * @param {string} materialId - 材料ID
 * @param {number} successRate - 材料成功率
 * @param {string} equipmentType - 装备类型
 * @param {string} equipmentLevel - 装备等级
 * @returns {Object|null} 返回材料提供的属性加成对象，如果材料无效则返回null
 */
const calculateMaterialBonus = (materialId, successRate, equipmentType, equipmentLevel) => {
  for (const type in materialConfig.material_types) {
    const typeConfig = materialConfig.material_types[type]
    const materials = typeConfig.materials
    if (materials[materialId]) {
      const material = materials[materialId]
      const bonus = {}

      // 获取装备位置的属性倍率
      const positionConfig = i18nConfig.equipment_position[equipmentType]
      const statMultipliers = positionConfig.stat_multipliers || {}

      for (const stat in typeConfig.base_stats) {
        // 计算基础属性值
        let value = Math.ceil(
          typeConfig.base_stats[stat] *
            material.multiplier *
            material.level *
            successRate *
            2 *
            (statMultipliers[stat] || 1)
        )
        
        // 只对固定值属性应用等级倍率
        if (!['crit_rate', 'crit_resist', 'hit_rate', 'dodge_rate'].includes(stat)) {
          const levelMultiplier = i18nConfig.equipment_levels[equipmentLevel].multiplier
          value = Math.ceil(value * levelMultiplier)
        }
        
        bonus[stat] = value
      }

      return bonus
    }
  }
  return null
}

/**
 * 锻造装备
 * @param {Object} state - Vuex状态对象
 * @param {Object} params - 锻造参数
 * @param {Array<string>} params.materials - 用于锻造的材料ID列表
 * @param {number} params.forgerLevel - 锻造师等级
 * @param {number} params.toolLevel - 工具等级
 * @param {string} params.equipmentType - 要锻造的装备类型
 * @returns {Object} 返回锻造结果
 *
 * 锻造流程：
 * 1. 验证材料数量（1-5个）和装备类型的有效性
 * 2. 根据锻造师等级和工具等级计算每个材料的成功率
 * 3. 计算成功融合的材料提供的属性加成
 * 4. 生成装备名称
 * 5. 将新装备添加到玩家未装备列表
 * 6. 移除已使用的材料
 *
 * 失败情况：
 * - 材料数量不在1-5之间
 * - 无效的装备类型
 * - 所有材料都未能成功融合
 */
import { state, updatePlayer } from '../state'

/**
 * 从玩家材料列表中移除指定的材料
 * @param {Array<string>} materials - 要移除的材料ID列表
 */
const removeMaterials = async (materials) => {
  const newMaterials = [...state.player.materials]
  materials.forEach((materialId) => {
    const index = newMaterials.indexOf(materialId)
    if (index !== -1) {
      newMaterials.splice(index, 1)
    }
  })
  await updatePlayer({
    materials: newMaterials,
  })
}

export const forgeEquipment = async ({
  materials,
  forgerLevel,
  toolLevel,
  equipmentType,
}) => {
  if (!materials || materials.length === 0 || materials.length > 5) {
    return {
      success: false,
      message: '材料数量必须在1-5之间',
    }
  }

  if (!i18nConfig.equipment_position[equipmentType]) {
    return {
      success: false,
      message: '无效的装备类型',
    }
  }

  // 计算每个材料的锻造成功率和结果
  const materialResults = materials.map((materialId) => {
    // 获取当前材料的等级
    let materialLevel = 0
    for (const type in materialConfig.material_types) {
      const materials = materialConfig.material_types[type].materials
      if (materials[materialId]) {
        materialLevel = materials[materialId].level
        break
      }
    }
    const successRate = calculateForgeSuccess(
      forgerLevel,
      toolLevel,
      materialLevel,
    )
    return {
      materialId,
      success: Math.random() < successRate,
      successRate,
      materialLevel
    }
  })

  const successfulMaterials = materialResults.filter((result) => result.success)

  if (successfulMaterials.length === 0) {
    await removeMaterials(materials)
    return {
      success: false,
      message: '锻造失败，所有材料都未能成功融合',
    }
  }

  // 获取等级最高的材料的成功率
  const maxLevelMaterial = successfulMaterials.reduce((max, current) => 
    current.materialLevel > max.materialLevel ? current : max
  )

  // 计算装备等级
  const equipmentLevel = calculateEquipmentLevel(forgerLevel, toolLevel, maxLevelMaterial.successRate)

  // 初始化装备属性
  const equipment = {
    type: equipmentType,
    position: equipmentType,
    level: equipmentLevel,
    combat_info: {},
  }

  // 从所有材料类型中收集可能的属性
  const possibleStats = new Set()
  for (const type in materialConfig.material_types) {
    const baseStats = materialConfig.material_types[type].base_stats
    for (const stat in baseStats) {
      possibleStats.add(stat)
    }
  }

  // 初始化所有可能的属性为0
  possibleStats.forEach((stat) => {
    equipment.combat_info[stat] = 0
  })

  // 计算材料属性加成
  successfulMaterials.forEach((result) => {
    const bonus = calculateMaterialBonus(
      result.materialId,
      result.successRate,
      equipmentType,
      equipmentLevel
    )
    if (bonus) {
      Object.keys(bonus).forEach((stat) => {
        equipment.combat_info[stat] += bonus[stat]
      })
    }
  })

  // 生成装备名称时包含等级信息
  equipment.name = generateEquipmentName(equipmentType, successfulMaterials, equipmentLevel)

  // 将装备添加到玩家未装备列表
  state.player.unequipped.push(equipment)

  // 移除已使用的材料
  await removeMaterials(materials)

  return {
    success: true,
    message: `锻造成功！${successfulMaterials.length}个材料成功融合`,
    equipment,
  }
}
