import { DraftResource, Resource, ResourceFile } from "../types/manage";

/**
 * Convert a DraftResource (from API) to Resource (for UI)
 */
export function draftResourceToResource(draftResource: DraftResource): Resource {
    return {
        id: Date.now(), // Generate temporary ID for local state
        name: draftResource.name,
        url: draftResource.url,
        size: draftResource.size,
    };
}

/**
 * Convert ResourceFile (from backend) to Resource (for UI)
 */
export function resourceFileToResource(resourceFile: ResourceFile): Resource {
    return {
        id: resourceFile.Id,
        name: resourceFile.Name,
        url: resourceFile.Url,
        size: undefined, // Backend doesn't provide size
    };
}