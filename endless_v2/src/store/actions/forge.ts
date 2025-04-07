import { locationApi } from '../../api';
import type { BaseResponse, Equipment } from '../../api';
import { state } from '../state';

// 锻造装备
export const forgeEquipment = async ({
  materials,
  equipmentType
}: {
  materials: string[];
  equipmentType: string;
}): Promise<BaseResponse<Equipment | null>> => {
  if (!materials || materials.length === 0 || materials.length > 5) {
    return {
      success: false,
      data: null,
      message: '材料数量必须在1-5之间',
    }
  }

  try {
    const response = await locationApi.forge({
      locationId: state.currentLocationId,
      playerId: state.player?._id || '',
      materialIds: materials,
      equipmentType,
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