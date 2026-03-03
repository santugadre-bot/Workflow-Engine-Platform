package com.workflow.engine.agile.dto;

import com.workflow.engine.agile.entity.BoardType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardResponse {
    private String id;
    private String name;
    private BoardType type;
    private String projectId;
    private String columnsConfig;
}
