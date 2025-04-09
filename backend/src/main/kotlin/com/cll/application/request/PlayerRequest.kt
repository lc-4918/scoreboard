package com.cll.application.request

import com.cll.domain.entity.Player
import org.bson.types.ObjectId

data class PlayerRequest(
    val username: String,
    val points: Int,
    val avatar: String? = null
)

fun PlayerRequest.toDomain() = Player(
    id = ObjectId(),
    username = username,
    points = points,
    avatar = avatar
)
