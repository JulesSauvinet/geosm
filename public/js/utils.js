/**
 * If Then Else pour être facilement
 * utilisé dans les vues
 */
function ite(condition, txt_then, txt_else) {

    if(condition) {
        return txt_then;
    }

    return txt_else || '';
}