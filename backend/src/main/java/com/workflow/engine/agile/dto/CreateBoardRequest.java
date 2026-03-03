package com.workflow.engine.agile.dto;

import com.workflow.engine.agile.entity.BoardType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBoardRequest {
    @NotBlank(message = "Board name is required")
    private String name;
    @NotNull(message = "Board type is required")
    private BoardType type;
}
