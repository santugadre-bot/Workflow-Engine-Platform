package com.workflow.engine.agile.service;

import com.workflow.engine.agile.entity.Board;
import com.workflow.engine.agile.entity.BoardType;
import com.workflow.engine.agile.repository.BoardRepository;
import com.workflow.engine.common.exception.ResourceNotFoundException;
import com.workflow.engine.rbac.entity.ProjectPermission;
import com.workflow.engine.rbac.service.ProjectPermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;
    private final ProjectPermissionService permissionService;

    @Transactional
    public Board createBoard(UUID projectId, String name, BoardType type, UUID userId) {
        permissionService.checkPermission(userId, projectId, ProjectPermission.CONFIGURE_BOARD);

        Board board = Board.builder()
                .projectId(projectId)
                .name(name)
                .type(type)
                .columnsConfig("[]") // Default empty config
                .build();
        return boardRepository.save(board);
    }

    @Transactional
    public Board updateBoardConfig(UUID boardId, String columnsConfig, UUID userId) {
        Board board = getBoard(boardId, userId);
        permissionService.checkPermission(userId, board.getProjectId(), ProjectPermission.CONFIGURE_BOARD);

        board.setColumnsConfig(columnsConfig);
        return boardRepository.save(board);
    }

    public List<Board> getBoardsByProject(UUID projectId, UUID userId) {
        permissionService.checkPermission(userId, projectId, ProjectPermission.BROWSE_PROJECT);
        return boardRepository.findByProjectId(projectId);
    }

    public Board getBoard(UUID boardId, UUID userId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board", "id", boardId));
        permissionService.checkPermission(userId, board.getProjectId(), ProjectPermission.BROWSE_PROJECT);
        return board;
    }
}
