package com.workflow.engine.agile.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateBoardConfigRequest {
    @NotBlank(message = "Columns configuration is required")
    private String columnsConfig;
}
