from enum import StrEnum


class TaskType(StrEnum):
    NUMBER = "NUMBER"
    IMAGE = "IMAGE"
    TEXT = "TEXT"


class SubmissionStatus(StrEnum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class ReactionType(StrEnum):
    MIND_BLOWN = "MIND_BLOWN"
    LAUGH = "LAUGH"
    RESPECT = "RESPECT"


class ItemType(StrEnum):
    GHOST = "GHOST"


class SquadMemberStatus(StrEnum):
    ACTIVE = "ACTIVE"
    ELIMINATED = "ELIMINATED"


class ChallengeStatus(StrEnum):
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"


class HapticType(StrEnum):
    HEAVY = "HEAVY"
    MEDIUM = "MEDIUM"
    LIGHT = "LIGHT"
    SUCCESS_CHIME = "SUCCESS_CHIME"
    FAILURE_BUZZ = "FAILURE_BUZZ"


class AudioType(StrEnum):
    CALCULATOR_CLICK = "CALCULATOR_CLICK"
    ORCHESTRA_CRESCENDO = "ORCHESTRA_CRESCENDO"
    MATCH_STRIKE = "MATCH_STRIKE"
    PLASMA_IGNITION = "PLASMA_IGNITION"
    ERROR_DULL = "ERROR_DULL"
