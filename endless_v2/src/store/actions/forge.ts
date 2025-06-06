import { locationApi } from '../../api';
import type { BaseResponse, Equipment } from '../../api';
import { state } from '../state';

// 锻造装备
export const forgeEquipment = async ({
  materials,
  assistMaterials,
  equipmentType,
  forgeToolLevel
}: {
  materials: string[];
  assistMaterials?: string[];
  equipmentType: string;
  forgeToolLevel: number;
}): Promise<BaseResponse<{
  equipment: Equipment | null;
  forgeCost: number;
  curForgeHeartSkill?: {
    level: number;
    exp: number;
  };
} | null>> => {
  if (!materials || materials.length === 0 || materials.length > 5) {
    return {
      success: false,
      data: null,
      message: '材料数量必须在1-5之间',
    }
  }

  if (assistMaterials && assistMaterials.length > 5) {
    return {
      success: false,
      data: null,
      message: '辅助材料数量不能超过5个',
    }
  }

  try {
    const response = await locationApi.forge({
      locationId: state.currentLocationId,
      playerId: state.player?._id || '',
      materialIds: materials,
      assistMaterialIds: assistMaterials || [],
      equipmentType,
      forgeToolLevel
    });

    return response;
  } catch (error) {
    console.error('锻造失败:', error);
    return {
      success: false,
      data: null,
      message: '锻造失败，请稍后重试',
    };
  }
}; 