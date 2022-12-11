table! {
    app_fonts (app_id, font_id) {
        app_id -> Int4,
        font_id -> Int4,
    }
}

table! {
    app_materials (app_id, material_id) {
        app_id -> Int4,
        material_id -> Int4,
    }
}

table! {
    app_users (app_id, user_id) {
        app_id -> Int4,
        user_id -> Int4,
    }
}

table! {
    apps (id) {
        id -> Int4,
        name -> Text,
    }
}

table! {
    badges (id) {
        id -> Int4,
        name -> Text,
        icon_url -> Text,
    }
}

table! {
    dimensions (id) {
        id -> Int4,
        name -> Text,
        width -> Float4,
        height -> Float4,
        pos -> Int4,
    }
}

table! {
    discounts (id) {
        id -> Int4,
        amount -> Int2,
        quantity -> Int2,
    }
}

table! {
    fixation_conditions (id) {
        id -> Int4,
        fixation_id -> Int4,
        shape_id -> Int4,
        area_min -> Nullable<Int4>,
        area_max -> Nullable<Int4>,
        padding_h -> Nullable<Float4>,
        padding_v -> Nullable<Float4>,
        pos_tl -> Nullable<Bool>,
        pos_tc -> Nullable<Bool>,
        pos_tr -> Nullable<Bool>,
        pos_cl -> Nullable<Bool>,
        pos_cr -> Nullable<Bool>,
        pos_bl -> Nullable<Bool>,
        pos_bc -> Nullable<Bool>,
        pos_br -> Nullable<Bool>,
    }
}

table! {
    fixations (id) {
        id -> Int4,
        name -> Text,
        preview_url -> Text,
        icon_url -> Text,
        video_url -> Nullable<Text>,
        price -> Float4,
        diameter -> Float4,
        drill_diameter -> Float4,
    }
}

table! {
    folders (id) {
        id -> Int4,
        parent_id -> Nullable<Int4>,
        name -> Text,
        category -> Text,
    }
}

table! {
    fonts (id) {
        id -> Int4,
        name -> Text,
        url -> Text,
    }
}

table! {
    material_badges (material_id, badge_id) {
        material_id -> Int4,
        badge_id -> Int4,
    }
}

table! {
    material_dimensions (material_id, dimension_id) {
        material_id -> Int4,
        dimension_id -> Int4,
    }
}

table! {
    material_discounts (material_id, discount_id) {
        material_id -> Int4,
        discount_id -> Int4,
    }
}

table! {
    material_fixations (material_id, fixation_id) {
        material_id -> Int4,
        fixation_id -> Int4,
    }
}

table! {
    material_shapes (material_id, shape_id) {
        material_id -> Int4,
        shape_id -> Int4,
    }
}

table! {
    materials (id) {
        id -> Int4,
        title -> Text,
        description -> Text,
        preview -> Text,
        background -> Text,
        min_width -> Float4,
        min_height -> Float4,
        max_width -> Float4,
        max_height -> Float4,
        weight -> Float4,
        fixed_price -> Float4,
        surface_price -> Float4,
        manufacturing_time -> Int2,
        more -> Nullable<Text>,
        transparency -> Int4,
    }
}

table! {
    pictos (id) {
        id -> Int4,
        folder_id -> Nullable<Int4>,
        tags -> Text,
        url -> Text,
    }
}

table! {
    shapes (id) {
        id -> Int4,
        folder_id -> Nullable<Int4>,
        tags -> Text,
        url -> Text,
    }
}

table! {
    templates (id) {
        id -> Int4,
        folder_id -> Nullable<Int4>,
        name -> Text,
        tags -> Text,
        preview_url -> Nullable<Text>,
        config -> Nullable<Text>,
    }
}

table! {
    users (id) {
        id -> Int4,
        username -> Text,
        password -> Text,
        token -> Nullable<Text>,
        is_admin -> Bool,
    }
}

joinable!(app_fonts -> apps (app_id));
joinable!(app_fonts -> fonts (font_id));
joinable!(app_materials -> apps (app_id));
joinable!(app_materials -> materials (material_id));
joinable!(app_users -> apps (app_id));
joinable!(app_users -> users (user_id));
joinable!(fixation_conditions -> fixations (fixation_id));
joinable!(fixation_conditions -> shapes (shape_id));
joinable!(material_badges -> badges (badge_id));
joinable!(material_badges -> materials (material_id));
joinable!(material_dimensions -> dimensions (dimension_id));
joinable!(material_dimensions -> materials (material_id));
joinable!(material_discounts -> discounts (discount_id));
joinable!(material_discounts -> materials (material_id));
joinable!(material_fixations -> fixations (fixation_id));
joinable!(material_fixations -> materials (material_id));
joinable!(material_shapes -> materials (material_id));
joinable!(material_shapes -> shapes (shape_id));
joinable!(pictos -> folders (folder_id));
joinable!(shapes -> folders (folder_id));
joinable!(templates -> folders (folder_id));

allow_tables_to_appear_in_same_query!(
    app_fonts,
    app_materials,
    app_users,
    apps,
    badges,
    dimensions,
    discounts,
    fixation_conditions,
    fixations,
    folders,
    fonts,
    material_badges,
    material_dimensions,
    material_discounts,
    material_fixations,
    material_shapes,
    materials,
    pictos,
    shapes,
    templates,
    users,
);
