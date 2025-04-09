package com.cll.domain.entity

import com.cll.application.response.PlayerResponse
import org.bson.codecs.pojo.annotations.BsonId
import org.bson.types.ObjectId

data class Player (
    @BsonId
    val id: ObjectId,
    val username: String,
    var points: Int,
    var avatar: String? = null
){
    fun toResponse(ranking: Int) = PlayerResponse(
        id = id.toString(),
        username = username,
        points = points,
        ranking = ranking,
        avatar = avatar ?: ""
    )
}