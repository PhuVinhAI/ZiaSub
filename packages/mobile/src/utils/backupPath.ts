export const formatBackupPath = (path: string): string => {
  if (!path) return "";

  try {
    if (path.startsWith("content://")) {
      const marker = path.includes("/tree/") ? "/tree/" : "/document/";
      const markerIndex = path.indexOf(marker);
      if (markerIndex < 0) return path;

      const encodedTreeId = path
        .slice(markerIndex + marker.length)
        .split("?")[0]
        .split("/document/")[0];
      const treeId = decodeURIComponent(encodedTreeId);
      const separator = treeId.indexOf(":");
      const relativePath = separator >= 0 ? treeId.slice(separator + 1) : treeId;
      if (relativePath) return relativePath.replace(/\//g, " / ");

      return treeId.slice(0, separator >= 0 ? separator : undefined) || path;
    }

    if (path.startsWith("file://")) {
      const trimmed = path.replace(/\/+$/, "");
      const segment = trimmed.slice(trimmed.lastIndexOf("/") + 1);
      return decodeURIComponent(segment) || path;
    }
  } catch {
    return path;
  }

  return path;
};
