package com.workflow.engine.agile.controller;

import com.workflow.engine.agile.dto.BoardResponse;
import com.workflow.engine.agile.dto.CreateBoardRequest;
import com.workflow.engine.agile.dto.UpdateBoardConfigRequest;
import com.workflow.engine.agile.entity.Board;
import com.workflow.engine.agile.service.BoardService;
import com.workflow.engine.auth.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    @PostMapping("/projects/{projectId}/boards")
    public ResponseEntity<BoardResponse> createBoard(@PathVariable UUID projectId,
            @RequestBody @Valid CreateBoardRequest request,
            @AuthenticationPrincipal User user) {
        Board board = boardService.createBoard(projectId, request.getName(), request.getType(),
                user.getId());
        return ResponseEntity.ok(toResponse(board));
    }

    @GetMapping("/projects/{projectId}/boards")
    public ResponseEntity<List<BoardResponse>> listBoards(@PathVariable UUID projectId,
            @AuthenticationPrincipal User user) {
        List<Board> boards = boardService.getBoardsByProject(projectId, user.getId());
        return ResponseEntity.ok(boards.stream().map(this::toResponse).collect(Collectors.toList()));
    }

    @GetMapping("/boards/{boardId}")
    public ResponseEntity<BoardResponse> getBoard(@PathVariable UUID boardId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(toResponse(boardService.getBoard(boardId, user.getId())));
    }

    @PutMapping("/boards/{boardId}/config")
    public ResponseEntity<BoardResponse> updateBoardConfig(@PathVariable UUID boardId,
            @RequestBody UpdateBoardConfigRequest request,
            @AuthenticationPrincipal User user) {
        Board board = boardService.updateBoardConfig(boardId, request.getColumnsConfig(), user.getId());
        return ResponseEntity.ok(toResponse(board));
    }

    private BoardResponse toResponse(Board board) {
        return BoardResponse.builder()
                .id(board.getId().toString())
                .name(board.getName())
                .type(board.getType())
                .projectId(board.getProjectId().toString())
                .columnsConfig(board.getColumnsConfig())
                .build();
    }
}
